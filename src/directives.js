function getParentWithMatchingSelector (target, selector) {
  let matches = [...document.querySelectorAll(selector)].filter(el =>
    el !== target && el.contains(target)
  )
  return (matches.length ? matches[0] : undefined)
}

function getElementForListener (el) {
  /*
    If the element is part of a dialog, attach the listener to the dialog,
    because dialogs stop propagation of click events
    Otherwise attach to app container
   */
  return getParentWithMatchingSelector(el, '.v-dialog') || document.querySelector('[data-app]') || document.body
}

const clickOutsideDirective = {
  inserted: function (el, binding, vnode) {
    el.clickOutsideEvent = function (event) {
      // here I check that click was outside the el and his childrens
      if (!(el === event.target || el.contains(event.target))) {
        // and if it did, call method provided in attribute value
        vnode.context[binding.expression](event)
      }
    }
    el.attachor = getElementForListener(el)
    el.attachor.addEventListener('click', el.clickOutsideEvent)
  },
  unbind: function (el) {
    el.attachor.removeEventListener('click', el.clickOutsideEvent)
  }
}

export { clickOutsideDirective }
