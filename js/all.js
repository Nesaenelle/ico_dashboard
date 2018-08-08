(function(jQuery) {

    var API = new API_CONSTRUCTOR();

    var $ = new CORE();

    function ELEM(params) {
        this.el = params.el || null;
    };

    ELEM.prototype.addEvent = function(type, fn) {
        this.el.addEventListener(type, fn, false);
        return this;
    };

    ELEM.prototype.addClass = function(className) {
        this.el.classList.add(className);
        return this;
    };

    ELEM.prototype.removeClass = function(className) {
        this.el.classList.remove(className);
        return this;
    };

    ELEM.prototype.toggleClass = function(className) {
        if (this.el.classList.contains(className)) {
            this.el.classList.remove(className);
        } else {
            this.el.classList.add(className);
        }
        return this;
    };


    ELEM.prototype.find = function(selector) {
        var el = this.el.querySelector(selector);
        return el ? new ELEM({ el: el }) : null;
    };

    ELEM.prototype.findAll = function(selector) {
        var self = this;
        var els = this.el.querySelectorAll(selector);
        els = Array.prototype.slice.call(els);
        return els.map(function(el) {
            return new ELEM({ el: el });
        });
    };

    function CORE() {

    };

    CORE.prototype.initElem = function(el) {
        return new ELEM({ el: el });
    };

    CORE.prototype.find = function(selector, context) {
        var el;
        if (selector instanceof HTMLElement) {
            el = selector;
        } else {
            el = context ? context.querySelector(selector) : document.querySelector(selector);
        }

        return this.initElem(el);
    };

    CORE.prototype.findAll = function(selector, context) {
        var self = this;
        var els = context ? context.querySelectorAll(selector) : document.querySelectorAll(selector);
        els = Array.prototype.slice.call(els);
        return els.map(function(o) {
            return self.initElem(o)
        });
    };


    function API_CONSTRUCTOR() {

    };

    API_CONSTRUCTOR.prototype.add = function(name, params) {
        if (!name || typeof name !== 'string') {
            throw new Error('API ERROR');
        }

        for (var method in params) {
            if (method !== 'constructor') {
                params.constructor.prototype[method] = params[method];
            }
        }

        this[name] = new params.constructor();
    };

    API.add('clock', {
        constructor: function() {
            var self = this;
            this.clock = $.find('[data-clock]');
            this.date = this.clock.find('[data-clock-date]');
            this.time = this.clock.find('[data-clock-time]');
            var self = this;

            this.monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            self.update();
            setInterval(function() {
                self.update();
            }, 1000);
        },
        update: function() {
            var date = new Date();
            this.date.el.innerHTML = this.monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
            this.time.el.innerHTML = date.toTimeString().split(' ')[0];
        }
    });

    API.add('themeSwitcher', {
        constructor: function() {
            this.checkbox = $.find('[data-theme-switcher] input');
            var self = this;
            this.checkbox.addEvent('change', function() {
                self.changeTheme();
            });
        },
        changeTheme: function() {
            if (this.checkbox.el.checked) {
                $.find(document.body).removeClass('light-theme');
            } else {
                $.find(document.body).addClass('light-theme');
            }
        }
    });

    API.add('tabs', {
        constructor: function() {
            var tabs = $.findAll('[data-tabs]');
            tabs.forEach(function(context) {
                var items = context.findAll('[data-tabs-item]');
                var contents = context.findAll('[data-tabs-content]');

                items.forEach(function(tab) {
                    tab.addEvent('click', function(e) {

                        items.forEach(function(a) { a.removeClass('active') });
                        tab.addClass('active');

                        var id = e.currentTarget.getAttribute('data-tabs-item');
                        var content = context.find('[data-tabs-content="' + id + '"]');
                        contents.forEach(function(a) { a.removeClass('active') });
                        if (content) {
                            content.addClass('active');
                        }
                    });

                });
            });
        }
    });

    API.add('chart', {
        constructor: function() {
            var btns = $.findAll('[data-chart-item]');
            btns.forEach(function(btn) {
                btn.addEvent('click', function(e) {

                    btns.forEach(function(a) { a.removeClass('active') });
                    btn.addClass('active');

                    // var id = e.currentTarget.getAttribute('data-tabs-item');

                });

            });


            jQuery.getJSON('js/data.json', function(data) {
                // create the chart
                Highcharts.stockChart('container', {
                    rangeSelector: {
                        selected: 1
                    },
                    title: {
                        text: 'AAPL Stock Price'
                    },
                    chart: {
                        backgroundColor: 'none',
                        marginTop: 0
                    },
                    rangeSelector: {
                        inputEnabled: false,
                        buttonTheme: {
                            visibility: 'hidden'
                        },
                        labelStyle: {
                            visibility: 'hidden'
                        }
                    },
                    plotOptions: {
                        candlestick: {
                            color: '#e55541',
                            upColor: '#00d983'
                        }
                    },
                    xAxis: {
                        color: 'red',
                        labels: {
                            style: {
                                color: '#c5d0de',
                                fontSize: 10
                            }
                        }
                    },
                    yAxis: {
                        opposite: false,
                        labels: {
                            formatter: function() {
                                return this.value.toFixed(2);
                            },
                            style: {
                                color: '#f1f4f8',
                                fontSize: 12
                            }
                        }
                    },
                    series: [{
                        type: 'candlestick',
                        name: 'AAPL Stock Price',
                        data: data,
                        dataGrouping: {
                            units: [
                                [
                                    'week', // unit name
                                    [1] // allowed multiples
                                ],
                                [
                                    'month', [1, 2, 3, 4, 6]
                                ]
                            ]
                        }
                    }]
                });
            });
        }
    });

    API.add('trade', {
        constructor: function() {
            var tabs = $.find('[data-trade]');
            var tradeScroller = $.find('#trade-scroller');
            var items = tabs.findAll('[data-trade-item]');
            items.forEach(function(tab) {
                tab.addEvent('click', function(e) {
                    items.forEach(function(a) { a.removeClass('active') });
                    tab.addClass('active');
                    var id = e.currentTarget.getAttribute('data-trade-item');

                    switch (id) {
                        case '1':
                            var tradeScrollerContent = tradeScroller.find('.simplebar-scroll-content').el;
                            tradeScrollerContent.scrollTop = tradeScrollerContent.scrollHeight / 2 - tradeScrollerContent.clientHeight / 2;
                            break;
                        case '2':
                            var tradeScrollerContent = tradeScroller.find('.simplebar-scroll-content').el;
                            tradeScrollerContent.scrollTop = 0;
                            break;
                        case '3':
                            var tradeScrollerContent = tradeScroller.find('.simplebar-scroll-content').el;
                            tradeScrollerContent.scrollTop = tradeScrollerContent.scrollHeight;
                            break;
                    }
                });

            });

            setTimeout(function() {
                var tradeScrollerContent = tradeScroller.find('.simplebar-scroll-content').el;
                tradeScrollerContent.scrollTop = tradeScrollerContent.scrollHeight / 2 - tradeScrollerContent.clientHeight / 2;
            }, 0);
        }
    });


    API.add('dropdown', {
        constructor: function() {
            var self = this;
            this.dropdowns = $.findAll('[data-dropdown]');
            this.dropdowns.forEach(function(dropdown) {
                var valueElem = dropdown.find('[data-dropdown-value]');
                var contentElem = dropdown.find('[data-dropdown-content]');
                var items = dropdown.findAll('[data-dropdown-item]');
                var input = dropdown.find('[data-dropdown-content-input]');

                if (input) {
                    input.addEvent('keyup', function(e) {
                        items.forEach(function(item) {
                            if (item.el.innerHTML.toUpperCase().indexOf(e.target.value.toUpperCase().trim()) > -1) {
                                item.el.style.display = 'block';
                            } else {
                                item.el.style.display = 'none';
                            }
                        });
                    });
                }

                valueElem.addEvent('click', function(e) {
                    e.stopPropagation();
                    self.closeAll();
                    dropdown.toggleClass('opened');
                });

                items.forEach(function(item) {
                    item.addEvent('click', function() {
                        valueElem.el.innerHTML = this.innerHTML;
                        dropdown.removeClass('opened');
                    });
                });

                window.addEventListener('click', function(e) {
                    if (dropdown.el.classList.contains('opened') && !contentElem.el.contains(e.target)) {
                        dropdown.removeClass('opened');
                    }
                }, false);
            });
        },
        closeAll: function() {
            this.dropdowns.forEach(function(dropdown) { dropdown.removeClass('opened') });
        }
    });

    API.add('fake-data', {
        constructor: function() {
            var self = this;
            var tpl1 = $.find("#trade-log-sell-template").el.innerHTML;
            var tpl2 = $.find("#trade-log-buy-template").el.innerHTML;
            var tpl3 = $.find("#trade-history-template").el.innerHTML;
            var tpl4 = $.find("#order-list-open-template").el.innerHTML;
            var tpl5 = $.find("#order-list-history-template").el.innerHTML;
            var tradeHistory = $.find('#trade-history').el;
            var tradeLogSellList = $.find('#trade-log-sell-list').el;
            var tradeLogBuyList = $.find('#trade-log-buy-list').el;
            var ordersOpenList = $.find('#orders-list-open').el;
            var ordersHistoryList = $.find('#orders-list-history').el;

            self.addItems(tpl1, tradeLogSellList, 11);
            self.addItems(tpl2, tradeLogBuyList, 11);
            self.addItems(tpl3, tradeHistory, 30);
            setTimeout(function() {
                self.addItems(tpl4, ordersOpenList, 15);
                self.addItems(tpl5, ordersHistoryList, 15);

                new SimpleBar(ordersOpenList, { autoHide: false });
                new SimpleBar(ordersHistoryList, { autoHide: false });
            }, 1000);
        },
        addItems: function(tpl, elem, count) {
            var template = Handlebars.compile(tpl);
            var item = document.createElement('div');
            elem.innerHTML = '';
            for (var i = 0; i < count; i++) {
                elem.appendChild(item);
                item.outerHTML = template({ className: i % 2 ? 'green' : 'red', text: i % 2 ? 'Buy' : 'Sell' });
            }
        }
    });

    API.add('toggle', {
        constructor: function() {
            var btns = $.findAll('[data-toggle]');
            var elem;

            btns.forEach(function(btn) {
                btn.addEvent('click', function(e) {
                    e.stopPropagation();
                    var id = btn.el.getAttribute('data-toggle');
                    if (elem) elem.removeClass('active');
                    elem = $.find('[data-toggle-content="' + id + '"]');
                    elem.toggleClass('active');
                });
            });

            window.addEventListener('click', function(e) {
                if (elem && elem.el.classList.contains('active') && !elem.el.contains(e.target)) {
                    elem.removeClass('active');
                }
            }, false);
        }
    });


    API.add('modal', {
        constructor: function() {
            var self = this;
            this.popupBtns = $.findAll('[data-modal-open]');
            this.modalOverlay = $.find('#modal-overlay');
            this.closeBtns = $.findAll('.js-close-modal');
            this.activeModal;

            this.popupBtns.forEach(function(btn) {
                btn.addEvent('click', function(e) {
                    e.preventDefault();
                    var id = e.currentTarget.getAttribute('data-modal-open');
                    e.stopPropagation();
                    self.openModal(id);
                });
            });


            this.closeBtns.forEach(function(btn) {
                btn.addEvent('click', function(e) {
                    self.activeModal.removeClass('opened');
                    self.modalOverlay.removeClass('opened');
                });
            });


            window.addEventListener('click', function(e) {
                if (self.activeModal && !self.activeModal.find('.modal-body').el.contains(e.target)) {
                    self.closeModal();
                }
            }, false);
        },

        closeModal: function(e) {
            if (this.activeModal) {
                this.activeModal.removeClass('opened');
                this.modalOverlay.removeClass('opened');
            }
        },

        openModal: function(id) {
            var self = this;
            this.closeModal();
            this.modalOverlay.addClass('opened');
            this.activeModal = $.find('.modal[data-modal="' + id + '"]');
            this.activeModal.addClass('opened');

            if (id === 'sign-in') {
                var formInst = new Form(this.activeModal.find('#sign-in-form').el);
                formInst.onSubmit(function() {
                    $.find('.dashboard-auth').addClass('authorized');
                    self.closeModal();
                });
            }

            if (id === 'sign-up') {
                var formInst = new Form(this.activeModal.find('#sign-up-form').el);
                formInst.onSubmit(function() {
                    // $.find('.dashboard-auth').addClass('authorized');
                    self.closeModal();
                });
            }
        }
    });


    function Form(form) {
        var self = this;
        this.controls = [];
        this.form = form;
        this.subscriptions = [];

        form.querySelectorAll('input').forEach(function(input) {
            self.controls.push(new Input(input, self));
        });

        form.onsubmit = function(e) {
            e.preventDefault();
            var focusState = false;

            self.controls.forEach(function(ctrl) {
                if (!focusState) {
                    ctrl.input.focus();
                    if (!ctrl.validate()) {
                        focusState = true;
                    }
                }
            });

            var errors = self.controls.reduce(function(a, b) {
                b = b.valid ? 0 : 1;
                return a + b;
            }, 0);

            if (errors === 0) {
                self.subscriptions.forEach(function(fn) { fn.call(self) });
                self.controls.forEach(function(ctrl) {
                    ctrl.input.value = '';
                    ctrl.clear();
                })
            }
        };
    };

    Form.prototype.validate = function() {
        this.controls.forEach(function(ctrl) {
            ctrl.validate()
        });
    };

    Form.prototype.onSubmit = function(fn) {
        this.subscriptions.push(fn);
    };


    function Input(input, parent) {
        var self = this;
        this.parent = parent;
        // this.msg = document.createElement('div');
        this.pattern = getPattern(input.getAttribute('data-pattern'));
        this.input = input;
        this.valid = false;
        this.value = input.value;
        input.oninput = function() {
            self.value = this.type === 'checkbox' ? this.checked : this.value;
            self.parent.validate();
        };
    }

    Input.prototype.validate = function() {
        if (this.input.getAttribute('data-pass-confirm')) {
            if (this.input.value === this.parent.form.querySelector('[data-pattern="password"]').value) {
                this.removeError();
            } else {
                this.addError();
            }
        } else {
            if ((this.input.type === 'text' || this.input.type === 'password') && this.pattern.test(this.input.value) || this.input.checked) {
                this.removeError();
            } else {
                this.addError();
            }
        }

        return this.valid;
    };

    Input.prototype.addError = function() {
        this.input.parentNode.classList.add('invalid');
        this.input.parentNode.classList.remove('valid');
        // this.msg.className = 'input-msg invalid';
        // this.msg.innerHTML = 'Enter the correct email';
        // this.input.parentNode.appendChild(this.msg);
        this.valid = false;
    };

    Input.prototype.removeError = function() {
        this.input.parentNode.classList.add('valid');
        this.input.parentNode.classList.remove('invalid');
        // this.msg.className = 'input-msg valid';
        // this.msg.innerHTML = 'This is correct email';
        // this.input.parentNode.appendChild(this.msg);
        this.valid = true;
    };

    Input.prototype.clear = function() {
        this.input.parentNode.classList.remove('valid');
        this.input.parentNode.classList.remove('invalid');
        // this.input.parentNode.removeChild(this.msg);
        this.valid = false;
    };

    function getPattern(o) {
        var pattern;
        switch (o) {
            case 'email':
                pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                break;

            case 'login':
                pattern = /^(?=.*[A-Za-z0-9]$)[A-Za-z][A-Za-z\d.-]{0,19}$/;
                break;

            case 'password':
                pattern = /^(?=.*[a-zA-Z0-9])(?=.*).{7,40}$/;
                break;

            case 'checkbox':
                pattern = /^on$/;
                break;
            case 'number':
                pattern = /^[0-9.,]+$/;
                break;
        }

        return pattern;
    }



    new Form($.find('#limit-buy').el);
    new Form($.find('#limit-sell').el);


    var inputs = $.findAll('[data-number-input]');

    inputs.forEach(function(input) {
        var numberMask = new IMask(input.el, {
            mask: Number, // enable number mask

            // other options are optional with defaults below
            // scale: 2,  // digits after point, 0 for integers
            // signed: false,  // disallow negative
            // thousandsSeparator: '',  // any single char
            // padFractionalZeros: false,  // if true, then pads zeros at end to the length of scale
            // normalizeZeros: true,  // appends or removes zeros at ends
            // radix: ',',  // fractional delimiter
            // mapToRadix: ['.']  // symbols to process as radix

            // additional number interval options (e.g.)
            min: 0,
            max: 1000000000000,
            thousandsSeparator: ','
        });
    });

}($));

$(".data-picker").datepicker({ dateFormat: 'dd-M-yy' });