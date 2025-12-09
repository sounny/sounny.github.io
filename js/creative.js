(function ($) {
  "use strict"; // Start of use strict

  // Cache commonly used selectors
  var $mainNav = $("#mainNav");
  var $window = $(window);
  var $htmlBody = $('html, body');
  var $navbarCollapse = $('.navbar-collapse');

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').on('click', function () {
    if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $htmlBody.animate({
          scrollTop: (target.offset().top - 72)
        }, 1000, "easeInOutExpo");
        return false;
      }
    }
  });

  // Closes responsive menu when a scroll trigger link is clicked
  $('.js-scroll-trigger').on('click', function () {
    $navbarCollapse.collapse('hide');
  });

  // Activate scrollspy to add active class to navbar items on scroll
  $('body').scrollspy({
    target: '#mainNav',
    offset: 75
  });

  // Collapse Navbar
  var navbarCollapse = function () {
    var navOffset = $mainNav.offset();
    if (navOffset && navOffset.top > 100) {
      $mainNav.addClass("navbar-scrolled");
    } else {
      $mainNav.removeClass("navbar-scrolled");
    }
  };
  // Collapse now if page is not at top
  navbarCollapse();
  // Collapse the navbar when page is scrolled
  $window.on('scroll', navbarCollapse);

})(jQuery); // End of use strict
