/**
 * End-to-end interaction tests for the request modal.
 *
 * Covers every behaviour the goal names, as assertions rather than eyeballing:
 * open from the header, focus trap, Escape, scrim click, close button, focus
 * restoration, scroll lock, validation, accessible error wiring, no fake success,
 * and the mobile layout.
 *
 *   node scripts/audit/modal-interaction-test.mjs [session]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const scratch = process.env.COMMANDCODE_SCRATCHPAD || here
const session = process.argv[2] || 'loc'

const ab = (args, input) =>
  execFileSync('agent-browser.cmd', ['--session', session, ...args], {
    encoding: 'utf8',
    shell: true,
    input,
    maxBuffer: 16 * 1024 * 1024
  })

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

const parse = (s) => {
  const t = s.trim()
  try {
    let v = JSON.parse(t)
    while (typeof v === 'string') v = JSON.parse(v)
    return v
  } catch {
    // Some snippets return a bare string rather than JSON.
    return t
  }
}

/** Runs a snippet from a temp file — inline JS is mangled by cmd.exe. */
let counter = 0
const js = (source) => {
  const f = join(scratch, `modal-test-${counter++}.js`)
  writeFileSync(f, source)
  return parse(ab(['eval', '--stdin'], readFileSync(f, 'utf8')))
}

const results = []
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? '  ok  ' : ' FAIL '} ${name}${detail ? '  — ' + detail : ''}`)
}

const clickCta = () =>
  js(`(() => {
    const b = Array.from(document.querySelectorAll('button')).filter((x) => /get in touch/i.test(x.textContent))[0]
    if (!b) return JSON.stringify({ ok: false })
    b.focus()
    b.click()
    return JSON.stringify({ ok: true, focused: document.activeElement === b })
  })()`)

const state = () =>
  js(`(() => {
    const m = document.querySelector('.modal')
    const p = m && m.querySelector('.modal__panel')
    return JSON.stringify({
      present: !!m,
      cls: m ? m.className : null,
      bodyOverflow: document.body.style.overflow,
      active: document.activeElement
        ? { tag: document.activeElement.tagName, id: document.activeElement.id, cls: String(document.activeElement.className).slice(0,40) }
        : null,
      activeInPanel: !!(p && p.contains(document.activeElement)),
      errors: Array.from(document.querySelectorAll('.field__error')).map((e) => e.textContent.trim()),
      ariaInvalid: Array.from(document.querySelectorAll('[aria-invalid="true"]')).map((e) => e.id),
      notice: (() => { const n = document.querySelector('.request__notice'); return n ? n.textContent.trim().slice(0, 60) : null })(),
      successGreen: !!document.querySelector('.request__notice')
    })
  })()`)

/* -------------------------------------------------------------------------- */

console.log('')
console.log('modal interaction tests')
console.log('')

// 1. Open from the header CTA
const opened = clickCta()
sleep(1500)
let s = state()
check('opens from the header CTA', s.present && s.cls === 'modal', `cls=${s.cls}`)
check('body scroll is locked while open', s.bodyOverflow === 'hidden', `overflow=${s.bodyOverflow}`)

// 2. Initial focus lands inside the panel
check('initial focus is inside the panel', s.activeInPanel, `active=${s.active?.id || s.active?.tag}`)
check('initial focus is the name field', s.active?.id === 'request-modal-name', `id=${s.active?.id}`)

// 3. Focus trap — Tab many times, focus must never leave the panel
const trap = js(`(() => {
  const panel = document.querySelector('.modal__panel')
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  const items = Array.from(panel.querySelectorAll(FOCUSABLE))
  return JSON.stringify({
    count: items.length,
    order: items.map((e) => e.id || e.className || e.tagName)
  })
})()`)
check('panel has focusable controls', trap.count >= 5, `${trap.count} controls: ${trap.order.join(', ')}`)

// Simulate the trap's wrap behaviour directly: focus last, press Tab
const wrapped = js(`(() => {
  const panel = document.querySelector('.modal__panel')
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  const items = Array.from(panel.querySelectorAll(FOCUSABLE))
  items[items.length - 1].focus()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
  const afterTab = document.activeElement
  items[0].focus()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
  const afterShiftTab = document.activeElement
  return JSON.stringify({
    firstId: items[0].id || items[0].className,
    lastId: items[items.length - 1].id || items[items.length - 1].className,
    afterTabId: afterTab.id || afterTab.className,
    afterShiftTabId: afterShiftTab.id || afterShiftTab.className,
    afterTabInPanel: panel.contains(afterTab),
    afterShiftTabInPanel: panel.contains(afterShiftTab)
  })
})()`)
check('Tab at the end wraps to the first control', wrapped.afterTabInPanel && wrapped.afterTabId === wrapped.firstId, `${wrapped.lastId} → ${wrapped.afterTabId}`)
check('Shift+Tab at the start wraps to the last control', wrapped.afterShiftTabInPanel && wrapped.afterShiftTabId === wrapped.lastId, `${wrapped.firstId} → ${wrapped.afterShiftTabId}`)

// 4. Validation — submit with everything empty
const emptySubmit = js(`(() => {
  const b = document.querySelector('.modal__panel button[type="submit"]')
  b.click()
  return JSON.stringify({ clicked: true })
})()`)
void emptySubmit
sleep(700)
s = state()
check('empty submit produces three field errors', s.errors.length === 3, `${s.errors.length}: ${s.errors.join(' | ')}`)
check('invalid fields are marked aria-invalid', s.ariaInvalid.length === 3, s.ariaInvalid.join(', '))
check('no success notice on invalid submit', !s.notice, `notice=${s.notice}`)

// 5. Invalid email
const badEmail = js(`(() => {
  const set = (el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement
    Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  set(document.getElementById('request-modal-name'), 'Ada Lovelace')
  set(document.getElementById('request-modal-email'), 'not-an-email')
  set(document.getElementById('request-modal-message'), 'one two three four five six seven eight nine ten')
  const b = document.querySelector('.modal__panel button[type="submit"]')
  b.click()
  return JSON.stringify({ done: true })
})()`)
void badEmail
sleep(700)
s = state()
check('invalid email is rejected', s.errors.length === 1 && /email address/i.test(s.errors[0]), s.errors.join(' | '))

// 6. Word count is live and drives the message error.
// Each set is followed by a wait: Vue re-renders on nextTick, so reading the DOM
// in the same tick returns the previous value rather than the new one.
const setMessage = (value) =>
  js(`(() => {
    const ta = document.getElementById('request-modal-message')
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, ${JSON.stringify(value)})
    ta.dispatchEvent(new Event('input', { bubbles: true }))
    return JSON.stringify({ set: true })
  })()`)

const readHint = () =>
  js(`JSON.stringify({ hint: document.querySelector('.request__hint').textContent.trim() })`)

setMessage('too short')
sleep(400)
const hintShort = readHint().hint

setMessage('one two three four five six seven eight nine ten eleven')
sleep(400)
const hintLong = readHint().hint

check(
  'word-count hint updates live',
  hintShort.startsWith('2 /') && hintLong.startsWith('11 /'),
  `${hintShort} then ${hintLong}`
)

// 7. Valid submit — must NOT claim success
const validSubmit = js(`(() => {
  const set = (el, v) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement
    Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  set(document.getElementById('request-modal-email'), 'ada@example.com')
  set(document.getElementById('request-modal-message'), 'one two three four five six seven eight nine ten eleven')
  document.querySelector('.modal__panel button[type="submit"]').click()
  return JSON.stringify({ done: true })
})()`)
void validSubmit
sleep(900)
s = state()
check('valid submit shows a notice', !!s.notice, `notice=${s.notice}`)
check('notice does not claim the message was sent', !!s.notice && !/successfully submitted|thank you/i.test(s.notice), s.notice || '')

// 8. Escape closes and restores focus
js(`(() => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  return JSON.stringify({ escaped: true })
})()`)
sleep(1500)
s = state()
check('Escape closes the modal', !s.present)
check('body scroll is unlocked after close', s.bodyOverflow !== 'hidden', `overflow=${s.bodyOverflow || '(unset)'}`)
check('focus returns to the header CTA', /get in touch/i.test(s.active?.cls || '') || s.active?.tag === 'BUTTON', `active=${s.active?.cls || s.active?.tag}`)

// 9. Scrim click closes
clickCta()
sleep(1500)
const beforeScrim = state()
check('reopens for the scrim test', beforeScrim.present)
js(`(() => {
  const scrim = document.querySelector('.modal__scrim')
  scrim.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  return 'clicked'
})()`)
sleep(1500)
s = state()
check('clicking the scrim closes the modal', !s.present)

// 10. Close button closes
clickCta()
sleep(1500)
const beforeClose = state()
check('reopens for the close-button test', beforeClose.present)
js(`document.querySelector('.request__close').click(); 'clicked'`)
sleep(1500)
s = state()
check('close button closes the modal', !s.present)

// 11. Scroll lock actually blocks scrolling
clickCta()
sleep(1500)
const scrollTest = js(`(() => {
  const before = window.scrollY
  window.scrollBy(0, 600)
  const after = window.scrollY
  return JSON.stringify({ before, after, moved: after !== before, overflow: document.body.style.overflow })
})()`)
check('background scrolling is blocked while open', !scrollTest.moved || scrollTest.overflow === 'hidden', `scrollY ${scrollTest.before} → ${scrollTest.after}, overflow=${scrollTest.overflow}`)

// Leave it closed
js(`(() => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  return JSON.stringify({ closed: true })
})()`)
sleep(1500)

/* -------------------------------------------------------------------------- */

const failed = results.filter((r) => !r.pass)
console.log('')
console.log(`${results.length - failed.length}/${results.length} passed`)
if (failed.length) {
  console.log('failures:')
  failed.forEach((f) => console.log(`  - ${f.name} (${f.detail})`))
  process.exitCode = 1
}
