// File#: _1_header
// Usage: codyhouse.co/license
(function () {
	var mainHeader = document.getElementsByClassName('js-header');
	if (mainHeader.length > 0) {
		var trigger = mainHeader[0].getElementsByClassName('js-header__trigger')[0],
			nav = mainHeader[0].getElementsByClassName('js-header__nav')[0];

		// we'll use these to store the node that needs to receive focus when the mobile menu is closed 
		var focusMenu = false;

		//detect click on nav trigger
		trigger.addEventListener("click", function (event) {
			event.preventDefault();
			toggleNavigation(!Util.hasClass(nav, 'header__nav--is-visible'));
		});

		// listen for key events
		window.addEventListener('keyup', function (event) {
			// listen for esc key
			if ((event.keyCode && event.keyCode == 27) || (event.key && event.key.toLowerCase() == 'escape')) {
				// close navigation on mobile if open
				if (trigger.getAttribute('aria-expanded') == 'true' && isVisible(trigger)) {
					focusMenu = trigger; // move focus to menu trigger when menu is close
					trigger.click();
				}
			}
			// listen for tab key
			if ((event.keyCode && event.keyCode == 9) || (event.key && event.key.toLowerCase() == 'tab')) {
				// close navigation on mobile if open when nav loses focus
				if (trigger.getAttribute('aria-expanded') == 'true' && isVisible(trigger) && !document.activeElement.closest('.js-header')) trigger.click();
			}
		});

		// listen for resize
		var resizingId = false;
		window.addEventListener('resize', function () {
			clearTimeout(resizingId);
			resizingId = setTimeout(doneResizing, 500);
		});

		function doneResizing() {
			if (!isVisible(trigger) && Util.hasClass(mainHeader[0], 'header--expanded')) toggleNavigation(false);
		};
	}

	function isVisible(element) {
		return (element.offsetWidth || element.offsetHeight || element.getClientRects().length);
	};

	function toggleNavigation(bool) { // toggle navigation visibility on small device
		Util.toggleClass(nav, 'header__nav--is-visible', bool);
		Util.toggleClass(mainHeader[0], 'header--expanded', bool);
		trigger.setAttribute('aria-expanded', bool);
		if (bool) { //opening menu -> move focus to first element inside nav
			nav.querySelectorAll('[href], input:not([disabled]), button:not([disabled])')[0].focus();
		} else if (focusMenu) {
			focusMenu.focus();
			focusMenu = false;
		}
	};
}());


// File#: _1_overscroll-section
// Usage: codyhouse.co/license
(function () {
	var OverscrollSection = function (element) {
		this.element = element;
		this.stickyContent = this.element.getElementsByClassName('js-overscroll-section__sticky-content');
		this.scrollContent = this.element.getElementsByClassName('js-overscroll-section__scroll-content');
		this.scrollingFn = false;
		this.scrolling = false;
		this.resetOpacity = false;
		this.disabledClass = 'overscroll-section--disabled';
		initOverscrollSection(this);
	};

	function initOverscrollSection(element) {
		// set position of sticky element
		setTop(element);
		// create a new node - to be inserted before the scroll element
		createPrevElement(element);
		// on resize -> reset element top position
		element.element.addEventListener('update-overscroll-section', function () {
			setTop(element);
			setPrevElementTop(element);
		});
		// set initial opacity value
		animateOverscrollSection.bind(element)();
		// change opacity of layer
		var observer = new IntersectionObserver(overscrollSectionCallback.bind(element));
		observer.observe(element.prevElement);
	};

	function createPrevElement(element) {
		if (element.scrollContent.length == 0) return;
		var newElement = document.createElement("div");
		newElement.setAttribute('aria-hidden', 'true');
		element.element.insertBefore(newElement, element.scrollContent[0]);
		element.prevElement = element.scrollContent[0].previousElementSibling;
		element.prevElement.style.opacity = '0';
		setPrevElementTop(element);
	};

	function setPrevElementTop(element) {
		element.prevElementTop = element.prevElement.getBoundingClientRect().top + window.scrollY;
	};

	function overscrollSectionCallback(entries) {
		if (entries[0].isIntersecting) {
			if (this.scrollingFn) return; // listener for scroll event already added
			overscrollSectionInitEvent(this);
		} else {
			if (!this.scrollingFn) return; // listener for scroll event already removed
			window.removeEventListener('scroll', this.scrollingFn);
			updateOpacityValue(this, 0);
			this.scrollingFn = false;
		}
	};

	function overscrollSectionInitEvent(element) {
		element.scrollingFn = overscrollSectionScrolling.bind(element);
		window.addEventListener('scroll', element.scrollingFn);
	};

	function overscrollSectionScrolling() {
		if (this.scrolling) return;
		this.scrolling = true;
		window.requestAnimationFrame(animateOverscrollSection.bind(this));
	};

	function animateOverscrollSection() {
		if (this.stickyContent.length == 0) return;
		setPrevElementTop(this);
		if (parseInt(this.stickyContent[0].style.top) != window.innerHeight - this.stickyContent[0].offsetHeight) {
			setTop(this);
		}
		if (this.prevElementTop - window.scrollY < window.innerHeight * 2 / 3) {
			var opacity = Math.easeOutQuart(window.innerHeight * 2 / 3 + window.scrollY - this.prevElementTop, 0, 1, window.innerHeight * 2 / 3);
			if (opacity > 0) {
				this.resetOpacity = false;
				updateOpacityValue(this, opacity);
			} else if (!this.resetOpacity) {
				this.resetOpacity = true;
				updateOpacityValue(this, 0);
			}
		} else {
			updateOpacityValue(this, 0);
		}
		this.scrolling = false;
	};

	function updateOpacityValue(element, value) {
		element.element.style.setProperty('--overscroll-section-opacity', value);
	};

	function setTop(element) {
		if (element.stickyContent.length == 0) return;
		var translateValue = window.innerHeight - element.stickyContent[0].offsetHeight;
		element.stickyContent[0].style.top = translateValue + 'px';
		// check if effect should be disabled
		Util.toggleClass(element.element, element.disabledClass, translateValue > 2);
	};

	//initialize the OverscrollSection objects
	var overscrollSections = document.getElementsByClassName('js-overscroll-section');
	var stickySupported = Util.cssSupports('position', 'sticky') || Util.cssSupports('position', '-webkit-sticky'),
		intObservSupported = ('IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype),
		reducedMotion = Util.osHasReducedMotion();
	if (overscrollSections.length > 0 && stickySupported && !reducedMotion && intObservSupported) {
		var overscrollSectionsArray = [];
		for (var i = 0; i < overscrollSections.length; i++) {
			(function (i) { overscrollSectionsArray.push(new OverscrollSection(overscrollSections[i])); })(i);
		}

		var resizingId = false,
			customEvent = new CustomEvent('update-overscroll-section');

		window.addEventListener('resize', function () {
			clearTimeout(resizingId);
			resizingId = setTimeout(doneResizing, 100);
		});

		// wait for font to be loaded
		document.fonts.onloadingdone = function (fontFaceSetEvent) {
			doneResizing();
		};

		function doneResizing() {
			for (var i = 0; i < overscrollSectionsArray.length; i++) {
				(function (i) { overscrollSectionsArray[i].element.dispatchEvent(customEvent) })(i);
			};
		};
	}
}());