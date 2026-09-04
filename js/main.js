/**
 * Sounny.github.io - Pure Vanilla JS
 * Dr. Moulay Anwar Sounny-Slitine
 * Zero external libraries (no jQuery, no Bootstrap JS, no Typed.js)
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Typing Effect for Hero Masthead ---
  const typedEl = document.getElementById("typedText");
  if (typedEl) {
    const titles = [
      "I am a Geographer",
      "I am a GeoAI Scientist",
      "I am an Educator",
      "I am a Remote Sensing Scientist",
      "I am a Coder & Engineer",
      "I am an Environmental Modeler",
      "I am a Geomorphologist",
      "I am a Cartographer",
      "I am an Academic & Researcher",
      "I am a Data Scientist",
      "I am an Information Technologist",
      "I am a Mentor & Advisor"
    ];

    let titleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typeDelay = 80;

    function typeLoop() {
      const current = titles[titleIdx];
      if (isDeleting) {
        typedEl.textContent = current.substring(0, charIdx - 1);
        charIdx--;
        typeDelay = 40;
      } else {
        typedEl.textContent = current.substring(0, charIdx + 1);
        charIdx++;
        typeDelay = 80;
      }

      if (!isDeleting && charIdx === current.length) {
        isDeleting = true;
        typeDelay = 1800; // Pause at full title
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        titleIdx = (titleIdx + 1) % titles.length;
        typeDelay = 350; // Pause before typing next
      }

      setTimeout(typeLoop, typeDelay);
    }

    typeLoop();
  }

  // --- 2. Mobile Navigation Toggle ---
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const nav = document.getElementById("mainNav");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen);
      navToggle.innerHTML = isOpen 
        ? `<i class="fas fa-times"></i>` 
        : `<i class="fas fa-bars"></i>`;
    });

    // Close mobile nav when clicking a link
    navLinks.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.innerHTML = `<i class="fas fa-bars"></i>`;
      });
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target) && navLinks.classList.contains("open")) {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.innerHTML = `<i class="fas fa-bars"></i>`;
      }
    });
  }

  // --- 3. Navbar Background on Scroll ---
  function onScroll() {
    if (window.scrollY > 40) {
      nav.classList.add("navbar-scrolled");
    } else {
      nav.classList.remove("navbar-scrolled");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // --- 4. IntersectionObserver Scrollspy for Navigation Active State ---
  const sections = document.querySelectorAll("section[id], header[id]");
  const navItems = document.querySelectorAll(".nav-link[href^=\"#\"]");

  if ("IntersectionObserver" in window && sections.length && navItems.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navItems.forEach(item => {
            const href = item.getAttribute("href").substring(1);
            if (href === id) {
              item.classList.add("active");
            } else {
              item.classList.remove("active");
            }
          });
        }
      });
    }, {
      rootMargin: "-20% 0px -70% 0px"
    });

    sections.forEach(sec => observer.observe(sec));
  }

  // --- 5. Web Apps Showroom Filtering & Search ---
  const filterBtns = document.querySelectorAll(".filter-btn");
  const appCards = document.querySelectorAll(".app-card");
  const searchInput = document.getElementById("appSearch");

  let currentCategory = "all";
  let currentSearch = "";

  function filterApps() {
    let visibleCount = 0;
    appCards.forEach(card => {
      const cardCat = card.getAttribute("data-category");
      const title = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
      const desc = card.querySelector(".card-desc")?.textContent.toLowerCase() || "";

      const matchesCat = (currentCategory === "all" || cardCat === currentCategory);
      const matchesSearch = !currentSearch || title.includes(currentSearch) || desc.includes(currentSearch);

      if (matchesCat && matchesSearch) {
        card.style.display = "flex";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    const noResults = document.getElementById("noAppResults");
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? "block" : "none";
    }
  }

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.getAttribute("data-filter");
      filterApps();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      filterApps();
    });
  }
});
