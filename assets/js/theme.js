(function ($) {
  "use strict";

  $(function () {
    var header = $(".start-style");
    $(window).scroll(function () {
      var scroll = $(window).scrollTop();

      if (scroll >= 10) {
        header.removeClass('start-style').addClass("scroll-on");
      } else {
        header.removeClass("scroll-on").addClass('start-style');
      }
    });
  });

  //Animation

  $(document).ready(function () {
    $('body.hero-anime').removeClass('hero-anime');
  });

  //Menu On Hover

  $('body').on('mouseenter mouseleave', '.nav-item', function (e) {
    if ($(window).width() > 750) {
      var _d = $(e.target).closest('.nav-item'); _d.addClass('show');
      setTimeout(function () {
        _d[_d.is(':hover') ? 'addClass' : 'removeClass']('show');
      }, 1);
    }
  });

  document.querySelectorAll('[lv-btn-copy]').forEach((el) => {
    const handleBtn = () => {
      const name = el.getAttribute('lv-btn-copy')
      console.log(document.querySelector(`input[name=${name}]`))
      const copy = document.querySelector(`input[name=${name}]`).value

      navigator.clipboard.writeText(copy)
    }
  })

  document.querySelectorAll('[lv-collapsed]').forEach((el) => {
    const btn = el.querySelector('[lv-collapsed-btn]')

    const render = () => {
      const btn = el.querySelector('[lv-collapsed-btn]')
      const item = el.querySelector('[lv-collapsed-item]')
      if (el.hasAttribute('lv-collapsed-open')) {
        btn.classList.remove('bg-white')
        btn.classList.remove('rounded-lg')
        btn.classList.add('border-transparent')
        btn.classList.add('rounded-t-lg')
        btn.classList.add('bg-chzzk')
        item.classList.remove('hidden')
        item.classList.remove('h-0')
        item.classList.add('block')
      }
      else {
        btn.classList.remove('bg-chzzk')
        btn.classList.remove('rounded-t-lg')
        btn.classList.remove('border-transparent')
        btn.classList.add('rounded-lg')
        btn.classList.add('bg-white')
        item.classList.remove('block')
        item.classList.add('hidden')
        item.classList.add('h-0')
      }
    }

    const handleBtn = () => {
      if (el.hasAttribute('lv-collapsed-open')) {
        el.removeAttribute('lv-collapsed-open')
      }
      else {
        el.setAttribute('lv-collapsed-open', '')
      }
      render()
    }
    btn.removeEventListener('click', handleBtn)
    btn.addEventListener('click', handleBtn)
    render()
  })


  const chatUrl = () => {
    const name = document.querySelector('#chzzkName')
    const obj = {
      id: document.querySelector('#chzzkName').value
    }

    if (name.value.length) {
      document.querySelectorAll('[lv-chzzk-url]').forEach((el) => {
        el.value = `${location.origin}/${el.getAttribute('lv-chzzk-url')}/?${btoa(JSON.stringify(obj))}`
      })
    }
    else {
      document.querySelectorAll('[lv-chzzk-url]').forEach((el, index) => {
        el.value = `치지직 주소를 입력해주세요.`
        if (index == document.querySelectorAll('[lv-chzzk-url]').length - 1) {
          name.focus()
        }
      })
    }
  }

  if (document.querySelector('#chzzkName')) {
    document.querySelector('#chzzkName').removeEventListener('blur', chatUrl)
    document.querySelector('#chzzkName').addEventListener('blur', chatUrl)
  }

})(jQuery);

// Blank Target External Links
$(document.links).filter(function () {
  return this.hostname != window.location.hostname;
}).attr('target', '_blank');