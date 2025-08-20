(function($) {
  "use strict"; // Start of use strict

  // Check if user prefers reduced motion
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth scrolling using jQuery easing
  $(document).on('click', 'a.js-scroll-trigger[href*="#"]:not([href="#"])', function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        // Respect prefers-reduced-motion: reduce duration or skip animation
        var duration = prefersReducedMotion ? 0 : 1000;
        var easing = $.easing && $.easing.easeInOutExpo ? "easeInOutExpo" : "swing";
        
        $('html, body').animate({
          scrollTop: (target.offset().top - 72)
        }, duration, easing);
        return false;
      }
    }
  });

  // Closes responsive menu when a scroll trigger link is clicked
  $(document).on('click', '.js-scroll-trigger', function() {
    $('.navbar-collapse').collapse('hide');
  });

  // Activate scrollspy to add active class to navbar items on scroll
  // Only initialize ScrollSpy if Bootstrap plugin is present and #mainNav exists
  if ($('#mainNav').length && $.fn.scrollspy) {
    $('body').scrollspy({
      target: '#mainNav',
      offset: 75
    });
  }

  // Throttle function using requestAnimationFrame
  function throttle(func, delay) {
    var inThrottle;
    return function() {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() { inThrottle = false; }, delay);
      }
    };
  }

  // Collapse Navbar
  var navbarCollapse = function() {
    var $mainNav = $("#mainNav");
    if ($mainNav.length && $mainNav.offset()) {
      if ($mainNav.offset().top > 100) {
        $mainNav.addClass("navbar-scrolled");
      } else {
        $mainNav.removeClass("navbar-scrolled");
      }
    }
  };
  
  // Collapse now if page is not at top
  navbarCollapse();
  // Throttle the navbar collapse scroll handler to improve performance
  $(window).scroll(throttle(navbarCollapse, 100));

  // Magnific popup calls
  // Only initialize if jQuery plugin exists and #portfolio element is present
  if ($('#portfolio').length && $.fn.magnificPopup) {
    $('#portfolio').magnificPopup({
      delegate: 'a',
      type: 'image',
      tLoading: 'Loading image #%curr%...',
      mainClass: 'mfp-img-mobile',
      gallery: {
        enabled: true,
        navigateByImgClick: true,
        preload: [0, 1]
      },
      image: {
        tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
      }
    });
  }

})(jQuery); // End of use strict
