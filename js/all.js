var BTCwallet = '';
var userId = 0;
var session = "";
var socket;
var SERVER_NAME = 'engine.exchange2.net'; // window.location.hostname

var API = new API_CONSTRUCTOR();

function API_CONSTRUCTOR() {
    this.promises = {};
    this.collection = [];
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


    this.collection.push({ name: name, params: params });
    this.promises[name] = new Promise(function(resolve, reject) {
        resolve();
    });
};

API_CONSTRUCTOR.prototype.on = function(name) {
    return this.promises[name];
};

API_CONSTRUCTOR.prototype.init = function(name) {
    var self = this;
    this.collection.forEach(function(o) {
        self[o.name] = new o.params.constructor();
    });
};


(function(jQuery) {


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

    API.add('status', {
        constructor: function() {
            this.btn = $.find('[data-status]');
            this.statuses = {
                open: {class: 'btn-green', text: 'open trade'},
                closed: {class: 'btn-red', text: 'trade closed'},
                disconnected: {class: 'btn-orange', text: 'disconnected'},
                connecting: {class: 'btn-orange', text: 'connecting'}
            };
        },
        setOpen: function() {
            this.btn.el.className = 'btn btn-small ' + this.statuses.open.class;
            this.btn.el.innerText = this.statuses.open.text;
        },
        setClosed: function() {
            this.btn.el.className = 'btn btn-small ' + this.statuses.closed.class;
            this.btn.el.innerText = this.statuses.closed.text;
        },
        setDiconnected: function() {
            this.btn.el.className = 'btn btn-small ' + this.statuses.disconnected.class;
            this.btn.el.innerText = this.statuses.disconnected.text;
        },
        setConnecting: function() {
            this.btn.el.className = 'btn btn-small ' + this.statuses.connecting.class;
            this.btn.el.innerText = this.statuses.connecting.text;
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
                            if (id == 1) {
                                bookmark = "orders";
                                chart.setBookmark("orders");
                            }
                            if (id == 2) {
                                bookmark = "orders_history";
                                chart.setBookmark("orders_history");
                            }
                            if (id == 3) {
                                bookmark = "transactions_history";
                                chart.setBookmark("transactions_history");
                            }
                        }
                    });

                });
            });
        }
    });


    API.add('trade', {
        constructor: function() {
            var tabs = $.find('[data-trade]');
            var tradeScroller = $.find('#trade-scroller');
            var items = tabs.findAll('[data-trade-item]');
            var title = tabs.find('[data-trade-title]').el;
            var tradeLogSellList = $.find('#trade-log-sell-list').el;
            var tradeLogBuyList = $.find('#trade-log-buy-list').el;

            items.forEach(function(tab) {
                tab.addEvent('click', function(e) {
                    items.forEach(function(a) { a.removeClass('active') });
                    tab.addClass('active');
                    var id = e.currentTarget.getAttribute('data-trade-item');

                    switch (id) {
                        case '1':
                            var tradeScrollerContent = tradeScroller.find('.simplebar-scroll-content').el;
                            tradeScrollerContent.scrollTop = tradeScrollerContent.scrollHeight / 2 - tradeScrollerContent.clientHeight / 2;
                            title.innerHTML = 'Trade Log';
                            tradeLogSellList.style.display = 'block';
                            tradeLogBuyList.style.display = 'block';
                            goCenter();
                            break;
                        case '2':
                            var tradeScrollerContent = tradeScroller.find('.simplebar-scroll-content').el;
                            tradeScrollerContent.scrollTop = 0;
                            title.innerHTML = 'Sell Log';
                            tradeLogSellList.style.display = 'block';
                            tradeLogBuyList.style.display = 'none';
                            break;
                        case '3':
                            var tradeScrollerContent = tradeScroller.find('.simplebar-scroll-content').el;
                            tradeScrollerContent.scrollTop = tradeScrollerContent.scrollHeight;
                            title.innerHTML = 'Buy Log';
                            tradeLogSellList.style.display = 'none';
                            tradeLogBuyList.style.display = 'block';
                            break;
                    }
                });

            });

            goCenter();

            function goCenter() {
                setTimeout(function() {
                    var tradeScrollerContent = tradeScroller.find('.simplebar-scroll-content').el;
                    tradeScrollerContent.scrollTop = tradeScrollerContent.scrollHeight / 2 - tradeScrollerContent.clientHeight / 2;
                }, 0);
            }

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
                    dropdown.addClass('opened');
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



    API.add('toggle', {
        constructor: function() {
            var btns = $.findAll('[data-toggle]');
            var elem;

            btns.forEach(function(btn) {
                var id = btn.el.getAttribute('data-toggle');
                var content = $.find('[data-toggle-content="' + id + '"]');
                btn.addEvent('click', function(e) {
                    e.stopPropagation();
                    //console.log(content);
                    if (elem) elem.removeClass('active');
                    elem = content;
                    elem.toggleClass('active');
                });

                var closeBtn = content.find('[data-toggle-content-close]');
                var action = content.find('[data-toggle-content-action]');
                if (closeBtn) {
                    closeBtn.addEvent('click', function() {
                        elem.removeClass('active');
                    });
                }
                if (action) {
                    action.addEvent('click', function() {
                        //
                    });
                }
            });

            window.addEventListener('click', function(e) {
                if (elem && elem.el.classList.contains('active') && !elem.el.contains(e.target)) {
                    elem.removeClass('active');
                }
            }, false);
        }
    });

    API.add('limit', {
        constructor: function() {
            var limit = $.find('[data-limit]');
            var items = limit.findAll('[data-limit-item]');
            items.forEach(function(item) {
                item.addEvent('click', function() {
                    items.forEach(function(a) { a.removeClass('active') });
                    item.addClass('active');
                });
            });
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

            //console.log(id)
            if (id === 'sign-in') {

                var formInst = new Form(this.activeModal.find('#sign-in-form').el);
                formInst.onSubmit(function() {

                    //console.log("--111--")
                    processLogin();

                    //console.log("userId " + userId)

                    self.closeModal();
                });
            }

            if (id === 'sign-up') {
                var formInst = new Form(this.activeModal.find('#registration-form').el);
                formInst.onSubmit(function() {
                    // $.find('.dashboard-auth').addClass('authorized');
                    processRegistration();

                    self.closeModal();
                });
            }
        }
    });



    function processLogin() {
        var $ = jQuery.noConflict();
        login = $("#sign-in-form :input[name='login']").val();
        password = $("#sign-in-form :input[name='password']").val();

        var formData = [{ name: 'auth', value: SHA256(login + ' ' + password) }];

        var auth = $('#sign-in-form');
        $.ajax({
            type: 'POST',
            url: 'http://' + SERVER_NAME + ':8008/auth',
            data: formData,
            success: function(data) {
                if (data == '-1') alert('Login error');
                else {
                    //console.log(data)
                    //session=data;
                    var results;
                    results = data.split(",");
                    session = results[0];
                    userId = results[1];
                    BTCWallet = results[2];
                    document.getElementsByClassName('dashboard-auth__email')[0].innerHTML = login + '(' + userId + ')'
                    $('.dashboard-auth').addClass('authorized');
                    //          [session, userId, BTCwallet] = data.split(",");
                    //document.getElementById('BTCwallet').innerHTML = "BTC wallet address: " + BTCwallet;
                    //document.getElementById('loginUserId').innerHTML = "UserID: " + userId;
                    requestData();

                    if (bookmark == "orders") $('#check_the_orders_list').click();
                    if (bookmark == "transactions_history") $('#check_the_transactions_history').click();
                    if (bookmark == "orders_history") $('#check_the_orders_history').click();


                    //chekc balance


                    $.ajax({
                        type: 'POST',
                        url: 'http://' + SERVER_NAME + ':8002/balance',
                        data: {
                            'c': 'btc',
                            'userId': userId,
                            'session': session
                        },
                        success: function(msg) {
                            jQuery('.balanceBTC').html(msg)
                            jQuery('#balanceBTC').html(msg)

                        }
                    });


                    $.ajax({
                        type: 'POST',
                        url: 'http://' + SERVER_NAME + ':8002/balance',
                        data: {
                            'c': 'eth',
                            'userId': userId,
                            'session': session
                        },
                        success: function(msg) {
                            //document.getElementById('balanceETH').innerHTML = msg;
                            jQuery('.balanceETH').html(msg)
                            jQuery('#balanceETH').html(msg)
                        }
                    });

                    $("#buy_button").show()
                    $("#sell_button").show()
                    $(".logInButton").hide()

                }
                //alert(data);
            },
            error: function(data) {
                console.log('An error occurred.');
                console.log(data);
            },
        });
    }

    function processRegistration() {
        var $ = jQuery.noConflict();
        var reg = $('#registration-form');

        login = $("#registration-form :input[name='login']").val();
        password = $("#registration-form :input[name='password']").val();

        var formData = [{ name: 'login', value: login }, { name: 'password', value: password }];

        $.ajax({
            type: reg.attr('method'),
            url: 'http://' + SERVER_NAME + ':8008/reg',
            data: formData,
            success: function(data) {
                if (data == '-1') alert('Registration error');
                else {
                    //session=data;
                    [session, userId] = data.split(",");
                    // alert(data);
                    API.modal.openModal('success');

                }
                //alert(data);
            },
            error: function(data) {
                console.log('An error occurred.');
                console.log(data);
            },
        });

    }


    function Form(form) {
        var self = this;
        this.controls = [];
        this.form = form;
        this.subscriptions = [function() {

            switch (this.form.id) {
                case 'limit-buy':
                    limitBuy(this)
                case 'limit-sell':
                    limitSell(this)

                    break;

            }
        }];

        form.querySelectorAll('input').forEach(function(input) {
            self.controls.push(new Input(input, self));
        });

        form.onsubmit = function(e) {
            e.preventDefault();
            //console.log("here is XXXX");
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

            //console.log(errors);

            if (errors === 0) {
                self.subscriptions.forEach(function(fn) {
                    //console.log(self);
                    fn.call(self)
                });
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
            self.validate();
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

        // this.removeError();
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
        if(this.input.checked) {
            this.input.checked = false;
        }
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

    API.init();
}($));


// var feed = [];
// var chart = new DashboardChart();
// chart.init();
// chart.redraw();

// var chart; // global
// var set_course;
var bookmark = "orders"; //orders_history, transactions_history
// var set_volume;
// var set_open;
// var set_close;
// var set_high;
// var set_low;
var userOrders = [];
var userOrdersHistory = [];
var userTransactionsHistory = [];
// //var userTransactionsHistory=[];


/**
 * Request data from the server, add it to the graph and set a timeout to request again
 */
jQuery.fn.sortDivs = function sortDivs(sort_desc = false) {
    jQuery("> div", this[0]).sort(dec_sort).appendTo(this[0]);

    function dec_sort(a, b) {
        a_ = parseInt(jQuery(a).attr('id'));
        b_ = parseInt(jQuery(b).attr('id'));
        if (!sort_desc) return b_ < a_ ? 1 : -1;
        return b_ > a_ ? 1 : -1;
    }
};

//var template = document.getElementById("trade-history-template");

// Get the contents of the template
var templateHtml = jQuery('#trade-history-template').html();
var templateHtmlOrderListOpen = jQuery('#order-list-open-template').html();
var templateHtmlOrderListHistory = jQuery('#order-list-history-template').html();
var templateHtmlOrderListFunds = jQuery('#order-list-funds-template').html();
var templateHtmlTradeHistory = jQuery('#trade-history-template').html();



// var margin = { top: 20, right: 50, bottom: 30, left: 50 },
//     width = 800 - margin.left - margin.right,
//     height = 460 - margin.top - margin.bottom;
// width = jQuery('.dashboard-block.dashboard-chart').width() - margin.left - margin.right;
// height = jQuery('.dashboard-block.dashboard-chart').height() - margin.top - margin.bottom - jQuery('.dashboard-chart__panel.dashboard-block__inner').height();

//var parseDate = d3.timeFormat("%d-%b-%y %H:%M:%S");

//var parseDate2 = d3.timeParse("%d-%b-%y");

// var x = techan.scale.financetime()
//     .range([0, width]);


// var y = d3.scaleLinear()
//     .range([height, 0]);

// var yVolume = d3.scaleLinear()
//     .range([y(0), y(0.2)]);

// var ohlc = techan.plot.candlestick()
//     .xScale(x)
//     .yScale(y);

// var sma0 = techan.plot.sma()
//     .xScale(x)
//     .yScale(y);

// var sma0Calculator = techan.indicator.sma()
//     .period(10);

// var sma1 = techan.plot.sma()
//     .xScale(x)
//     .yScale(y);

// var sma1Calculator = techan.indicator.sma()
//     .period(20);

// var volume = techan.plot.volume()
//     .accessor(ohlc.accessor()) // Set the accessor to a ohlc accessor so we get highlighted bars
//     .xScale(x)
//     .yScale(yVolume);

// var xAxis = d3.axisBottom(x);

// var yAxis = d3.axisRight(y);
// //var yAxis = d3.axisRight(y);

// var volumeAxis = d3.axisRight(yVolume)
//     .ticks(3)
//     .tickFormat(d3.format(",.3s"));

// var timeAnnotation = techan.plot.axisannotation()
//     .axis(xAxis)
//     .orient('bottom')
//     .format(d3.timeFormat('%Y-%m-%d %H:%M'))
//     .width(100)
//     .translate([0, height]);

// var ohlcAnnotation = techan.plot.axisannotation()
//     .axis(yAxis)
//     .orient('right')
//     .translate([x(1), 0])
//     //.translate([0, height])
//     .format(d3.format(',.2f'));

// var closeAnnotation = techan.plot.axisannotation()
//     .axis(yAxis)
//     .orient('right')
//     .accessor(ohlc.accessor())
//     .format(d3.format(',.2f'))
//     .translate([x(1), 0]);

// var volumeAnnotation = techan.plot.axisannotation()
//     .axis(volumeAxis)
//     .orient('right')
//     .width(35);



// var svg = d3.select("div#chart").append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom);

// var defs = svg.append("defs");

// defs.append("clipPath")
//     .attr("id", "ohlcClip")
//     .append("rect")
//     .attr("x", 0)
//     .attr("y", 0)
//     .attr("width", width)
//     .attr("height", height);

// svg = svg.append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// svg.append("g")
//     .attr("class", "volume axis");



// svg.append("g")
//     .attr("class", "x axis")
//     .attr("transform", "translate(0," + height + ")");

// svg.append("g")
//     .attr("class", "y axis")
//     .attr("transform", "translate(" + x(1) + ",0)")
//     .append("text")
//     .attr("transform", "rotate(-90)")
//     .attr("y", 6)
//     .attr("dy", ".71em")

//     .style("text-anchor", "end")
//     .text("Price ($)");








// var coordsText = svg.append('text')
//     .style("text-anchor", "end")
//     .attr("class", "coords")
//     .attr("x", width - 5)
//     .attr("y", 15);

var feed = [];
// var accessor = ohlc.accessor();




// var ohlcSelection = svg.append("g")
//     .attr("class", "candlestick")
//     .attr("transform", "translate(0,0)");

// ohlcSelection.append("g")
//     .attr("class", "volume")
//     .attr("clip-path", "url(#ohlcClip)");

// ohlcSelection.append("g")
//     .attr("class", "candlestick")
//     .attr("clip-path", "url(#ohlcClip)");

// ohlcSelection.append("g")
//     .attr("class", "indicator sma ma-0")
//     .attr("clip-path", "url(#ohlcClip)");

// ohlcSelection.append("g")
//     .attr("class", "indicator sma ma-1")
//     .attr("clip-path", "url(#ohlcClip)");

// ohlcSelection.append("g")
//     .attr("class", "close annotation up");


// var crosshair = techan.plot.crosshair()
//     .xScale(x)
//     .yScale(y)
//     .xAnnotation(timeAnnotation)
//     .yAnnotation([ohlcAnnotation, volumeAnnotation])
//     .on("move", move);


// svg.append('g')
//     .attr("class", "crosshair ohlc");

/*d3.csv("data.csv", function(error, csv) {
    var accessor = ohlc.accessor();

    feed = csv.map(function(d) {
        return {
            date: parseDate2(d.Date),
            open: +d.Open,
            high: +d.High,
            low: +d.Low,
            close: +d.Close,
            volume: +d.Volume
        };
    }).sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });
feed = feed.slice(0, 163);
    // Start off an initial set of data
    redraw(feed.slice(0, 163));
});*/

//var data = feed;
//data.sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });
//redraw(data);
// function resize() {

// }


// redraw(feed.slice(feed.length - 130, feed.length));

// function redraw(data) {
//     var accessor = ohlc.accessor();

//     x.domain(data.map(accessor.d));
//     // Show only 150 points on the plot
//     x.zoomable().domain([data.length - 130, data.length]);



//     // Update y scale min max, only on viewable zoomable.domain()
//     y.domain(techan.scale.plot.ohlc(data.slice(data.length - 130, data.length)).domain());
//     yVolume.domain(techan.scale.plot.volume(data.slice(data.length - 130, data.length)).domain());

//     // Setup a transition for all that support
//     svg
//         //          .transition() // Disable transition for now, each is only for transitions
//         .each(function() {
//             var selection = d3.select(this);
//             selection.select('g.x.axis').call(xAxis);
//             selection.select('g.y.axis').call(yAxis);
//             selection.select("g.volume.axis").call(volumeAxis);

//             selection.select("g.candlestick").datum(data).call(ohlc);
//             selection.select("g.sma.ma-0").datum(sma0Calculator(data)).call(sma0);
//             selection.select("g.sma.ma-1").datum(sma1Calculator(data)).call(sma1);
//             selection.select("g.volume").datum(data).call(volume);

//             svg.select("g.crosshair.ohlc").call(crosshair);
//         });

//     //svg.selectAll("g.y.annotation.right").datum(data[data.length-1]).call(closeAnnotation);
//     //svg.select("g.close.annotation").datum([data[data.length-1]]).call(closeAnnotation);

//     // Set next timer expiry
//     /* setTimeout(function() {
//         var newData;

//         if(data.length < feed.length) {
//             // Simulate a daily feed
//             newData = feed.slice(0, feed.length);
//         }
//         else {
//     data.shift();
//             data.push({
//       date: new Date(),
//       open: set_open,
//       high: set_high,
//       low: set_low,
//       close: set_close,
//       volume: set_volume
//     });

//     svg.select("g.close.annotation").datum([data[data.length-1]]).call(closeAnnotation);


//             newData = data;
//         }

//         redraw(newData);
//     }, (Math.random()*1000*60)); // Randomly pick an interval to update the chart
// */
// }

// function move(coords) {
//     coordsText.text(
//         timeAnnotation.format()(coords.x) + ", " + ohlcAnnotation.format()(coords.y)
//     );
// }
requestData();

var start_counter = 0;
// setTimeout(function(){
//     socket.onerror();
// },2999);


function requestData() {

    if (socket !== null && typeof(socket) == 'object') {
        //console.log(typeof(socket));
        socket.close();
    }
    // Create a new WebSocket.
    socket = new WebSocket('ws://' + SERVER_NAME + ':8001/ws?session=' + session + '&' + 'userId=' + userId);

    // Handle any errors that occur.
    socket.onerror = function(error) {
        console.log('WebSocket Error: ' + error);
        API.status.setDiconnected();
        setTimeout(function(){
            API.status.setConnecting();
            setTimeout(function(){
                requestData();
            }, 1000);
        }, 10000);
    };

    socket.addEventListener('close', function (event) {
          API.status.setClosed();
    });

    socket.addEventListener('open', function (event) {
        API.status.setOpen();
    });

    // Handle messages sent by the server.
    socket.addEventListener('message', function(event) {
        // API.status.setOpen();
        addRow(event.data);
        console.log(event.data);
        // chart.addRow(event.data);
    });


}


function addRow(data) {
    var $ = jQuery.noConflict();
    var div;
    var d;
    [course, actionType, no_isBuy, lo_id, lo_amount, lo_price, no_id, no_amount, no_price, hhigh, hlow, hvol, hfirst] = data.split(",");
    //if action type one minute - show opend, close, high, low, volume, time for minue
    //if second - show - show opend, close, high, low, volume, time for current second

    if (actionType == "START") {
        // broadcast <- fmt.Sprintf(",CPV,,,%v,%v,%v,%v,%v", currentPriceLvl.volume, currentPriceLvl.open, currentPriceLvl.high, currentPriceLvl.low, currentPriceLvl.close)
        set_volume = parseInt(lo_amount);
        set_course = parseInt(no_price);
        set_open = parseInt(lo_price);
        set_high = parseInt(no_id);
        set_low = parseInt(no_amount);
        set_close = parseInt(no_price);
        //console.log(lo_id);
        d = new Date(parseInt(lo_id + "000"));
        d.setSeconds(0, 0);
        feed.push({
            date: d,
            open: set_open,
            high: set_high,
            low: set_low,
            close: set_close,
            volume: set_volume
        });
        // feed.sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });
        start_counter = start_counter + 1;
        if (start_counter >= 130) {
            // redraw(feed);
        }
    }

    if (actionType == "CPV") {
        // broadcast <- fmt.Sprintf(",CPV,,,%v,%v,%v,%v,%v", currentPriceLvl.volume, currentPriceLvl.open, currentPriceLvl.high, currentPriceLvl.low, currentPriceLvl.close)
        set_volume = parseInt(lo_amount);
        set_course = parseInt(no_price);
        set_open = parseInt(lo_price);
        set_high = parseInt(no_id);
        set_low = parseInt(no_amount);
        set_close = parseInt(no_price);


        d = new Date();
        d.setSeconds(0, 0);
        feed.push({
            date: d,
            open: set_open,
            high: set_high,
            low: set_low,
            close: set_close,
            volume: set_volume
        });
        // feed.sort(function(a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

        // redraw(feed);
        // svg.select("g.close.annotation").datum([feed[feed.length - 1]]).call(closeAnnotation);

        //todo move into correct place (course/voulume)
        jQuery('.course').html(set_course / 1000 + " ETH")
        jQuery('.volume').html(set_volume)
        jQuery('.hhigh').html(hhigh)
        jQuery('.hlow').html(hlow)
        jQuery('.hvol').html(hvol)
        jQuery('.hchange').html(set_course - hfirst)
        jQuery('.hchangep').html((set_course - hfirst) * 100 / hfirst + "%")



    }

    if (actionType == "UPV") {
        // broadcast <- fmt.Sprintf(",CPV,,,%v,%v,%v,%v,%v", currentPriceLvl.volume, currentPriceLvl.open, currentPriceLvl.high, currentPriceLvl.low, currentPriceLvl.close)
        set_volume = parseInt(lo_amount);
        set_course = parseInt(no_price);
        set_open = parseInt(lo_price);
        set_high = parseInt(no_id);
        set_low = parseInt(no_amount);
        set_close = parseInt(no_price);

        d = feed[feed.length - 1].date;
        //d.setSeconds(0,0);

        feed.pop();
        feed.push({
            date: d,
            open: set_open,
            high: set_high,
            low: set_low,
            close: set_close,
            volume: set_volume
        });



        // redraw(feed);
        // svg.select("g.close.annotation").datum([feed[feed.length - 1]]).call(closeAnnotation);


        //todo move into correct place (course/voulume)
        jQuery('.course').html(set_course / 1000 + " ETH")
        jQuery('.volume').html(set_volume)


        jQuery('.hhigh').html(hhigh)
        jQuery('.hlow').html(hlow)
        jQuery('.hvol').html(hvol)
        jQuery('.hchange').html(set_course - hfirst)
        jQuery('.hchangep').html(((set_course - hfirst) * 100 / hfirst).toFixed(2) + "%")
    }

    if (actionType == "LP") {

        if (no_isBuy == 'true') {
            if ($('#trade-log-buy-list #' + lo_price).length) {
                if (lo_amount == 0) {
                    $('#trade-log-buy-list #' + lo_price).remove();
                } else {
                    str = jQuery('#trade-log-buy-template').html();
                    //lo_price=parseInt(lo_price);
                    str = str.replace("{amount}", lo_amount)
                        .replace("{price}", formatMoney(lo_price))
                        .replace("{total}", formatMoney(lo_price * lo_amount));
                    $('#trade-log-buy-list #' + lo_price).html(str)
                }
            } else {
                if (lo_amount == 0) return;
                div = document.createElement('div');
                div.className = 'row';
                //lo_price=parseInt(lo_price);
                //div.innerHTML = "<b> " + lo_amount + " " + lo_price/1000 + "</b>";
                str = jQuery('#trade-log-buy-template').html();
                str = str.replace("{amount}", lo_amount)
                    .replace("{price}", formatMoney(lo_price))
                    .replace("{total}", formatMoney(lo_price * lo_amount));
                div.innerHTML = str;
                div.id = lo_price;
                document.getElementById('trade-log-buy-list').appendChild(div);
                $('#trade-log-buy-list').sortDivs(true);

            }

        } else {
            if ($('#trade-log-sell-list #' + lo_price).length) {
                if (lo_amount == 0) {
                    $('#trade-log-sell-list #' + lo_price).remove();
                } else {
                    //$('#trade-log-sell-list #' + lo_price).html("<b>" + lo_amount + " " + lo_price/1000 + "</b>");
                    str = jQuery('#trade-log-sell-template').html();
                    str = str.replace("{amount}", lo_amount)
                        .replace("{price}", formatMoney(lo_price))
                        .replace("{total}", formatMoney(lo_price * lo_amount));
                    $('#trade-log-sell-list #' + lo_price).html(str)
                }
            } else {
                if (lo_amount == 0) return;
                div = document.createElement('div');
                div.className = 'row';
                //div.innerHTML = "<b>" + lo_amount + " " + lo_price/1000 + "</b>";

                str = jQuery('#trade-log-sell-template').html();
                str = str.replace("{amount}", lo_amount)
                    .replace("{price}", formatMoney(lo_price))
                    .replace("{total}", formatMoney(lo_price * lo_amount));

                div.id = lo_price;
                div.innerHTML = str;

                document.getElementById('trade-log-sell-list').appendChild(div);
                $('#trade-log-sell-list').sortDivs(true);
            }
        }


        $('#trade-log-buy-list').find('.row:gt(10)').show(); //???
        $('#trade-log-buy-list').find('.row:lt(10)').show(); //??? buy only?
        return;
    }

    if (actionType == "UB" && session != "") {
        //,UB,0,ETH,10031,12,506
        //[course, actionType, no_isBuy, lo_id, lo_amount, lo_price, no_id, no_amount, no_price] = data.split(",");
        balanceCurrency = lo_id;
        balanceAmount = lo_amount;
        document.getElementById('balance' + balanceCurrency).innerHTML = balanceAmount;
        jQuery('.' + 'balance' + balanceCurrency).html(balanceAmount)

        //if (bookmark == "orders") $('#check_the_orders_list').click();
        //if (bookmark == "transactions_history") $('#check_the_transactions_history').click();
        //if (bookmark == "orders_history") $('#check_the_orders_history').click();

        //
    }

    if (actionType == "TL") {
        result = no_isBuy.split("|")
        result.forEach(updateOTransactionsList)


    }

    if (actionType == "ADD_O" || actionType == "ADD_HO" || actionType == "ADD_HT") {
        //,ADD_O,547,1,true,BTC/ETH,1,1534355696,1,12
        //[course, actionType, no_isBuy, lo_id, lo_amount, lo_price, no_id, no_amount, no_price] = data.split(",");
        //,ADD_O,555,2,true,BTC/ETH,3,1534355955,1,16
        orderId = no_isBuy;
        price = lo_id;
        if (lo_amount == "true") {
            isBuy = true;
        } else {
            isBuy = false;
        }
        amount = no_id;
        pair = lo_price;
        time = no_amount;
        [status, _] = no_price.split(",");
        //2 - price 3 - amount
        //1 - status
        //16 - userid
        //555 - orderid
        if (actionType == "ADD_O") {
            userOrders[no_isBuy] = { Amount: amount, IsBuy: isBuy, Pair: pair, Price: price, Status: status, Time: time };

        }

        if (actionType == "ADD_HO") {
            userOrdersHistory[no_isBuy] = { Amount: amount, IsBuy: isBuy, Pair: pair, Price: price, Status: status, Time: time };
            delete userOrders[no_isBuy];
        }

        if (actionType == "ADD_HT") {
            userTransactionsHistory[no_isBuy] = { Amount: amount, IsBuy: isBuy, Pair: pair, Price: price, Status: status, Time: time };
        }

        //,UB,0,ETH,10031,12,506
        //[course, actionType, no_isBuy, lo_id, lo_amount, lo_price, no_id, no_amount, no_price] = data.split(",");
        //balanceCurrency = lo_id;
        //balanceAmount = lo_amount;
        //document.getElementById('balance' + balanceCurrency).innerHTML = balanceAmount;
        if (bookmark == "orders") updateOrdersListData(userOrders, 'orders-list-open');
        if (bookmark == "orders_history") updateOrdersListData(userOrdersHistory, 'orders-list-history');
        if (bookmark == "transactions_history") updateOrdersListData(userTransactionsHistory, 'transactions-list-history');

        //if (bookmark == "orders") $('#check_the_orders_list').click();
        //if (bookmark == "transactions_history") $('#check_the_transactions_history').click();
        //if (bookmark == "orders_history") $('#check_the_orders_history').click();

        //
    }


    if (actionType == "FILLED" || actionType == "PARTIAL_FILLED") {
        div = document.createElement('div');
        div.className = 'row';

        order_type = "BUY";
        if (no_isBuy == 'true') {
            order_type = "SELL";
        }
        if (actionType == "FILLED") div.innerHTML = "<b>" + order_type + " " + lo_amount + " " + lo_price / 1000 + "</b>";
        //  data;

        document.getElementById('orders').appendChild(div);

        div = document.createElement('div');
        div.className = 'row';

        order_type = "SELL";
        if (no_isBuy == 'true') {
            order_type = "BUY";
        }
        div.innerHTML = "<b>" + order_type + " " + no_amount + " " + no_price / 1000 + "</b>";
        //  data;

        document.getElementById('orders').appendChild(div);





    }

    $('#orders div').slice(0, -30).remove();
    //document.getElementById('course').innerHTML =  // + " " + set_volume + " ";




    //if (actionType == "FILLED" || actionType == "PARTIAL_FILLED" ){

}

function convertTimestamp(timestamp) {
    var d = new Date(timestamp * 1000), // Convert the passed timestamp to milliseconds
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
        dd = ('0' + d.getDate()).slice(-2), // Add leading 0.
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2), // Add leading 0.
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh == 0) {
        h = 12;
    }

    // ie: 2014-03-24, 3:00 PM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;
    return time;
}


/*setTimeout(function() {
                var newData;

                if(data.length < feed.length) {
                    // Simulate a daily feed
                    newData = feed.slice(0, data.length+1);
                }
                else {


                    // later record end time
                    var endTime = new Date();

                    // time difference in ms
                    var timeDiff = endTime - startTime;

                    // strip the ms
                    timeDiff /= 1000;

                    // get seconds (Original had 'round' which incorrectly counts 0:28, 0:29, 1:30 ... 1:59, 1:0)
                    var seconds = Math.round(timeDiff % 60);

                    if (seconds > 5){
                        //data.push();
                        startTime = new Date();
                    }
                    let i = data.length;
                    if (i > 0 ){
                        i = i-1;
                    }

                    var last = data[i];
                    // Last must be between high and low
                    //last.close = Math.round(((last.high - last.low)*Math.random())*10)/10+last.low;
                    //parseDate = d3.timeFormat("%d-%b-%y");
                    //console.log(parseDate(endTime));
                    //last.date = endTime;
                    last.open = set_open;
                    last.high = set_high;
                    last.low = set_low;
                    last.close = set_close;
                    last.volume = set_volume;
                    console.log(last);
                    newData = data;
                }

                redraw(newData);*/



/**
 *
 *  Secure Hash Algorithm (SHA256)
 *  http://www.webtoolkit.info/
 *
 *  Original code by Angel Marin, Paul Johnston.
 *
 **/
function SHA256(s) {
    var chrsz = 8;
    var hexcase = 0;

    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    function S(X, n) { return (X >>> n) | (X << (32 - n)); }

    function R(X, n) { return (X >>> n); }

    function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }

    function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }

    function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }

    function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }

    function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }

    function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }

    function core_sha256(m, l) {
        var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
        var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
        var W = new Array(64);
        var a, b, c, d, e, f, g, h, i, j;
        var T1, T2;
        m[l >> 5] |= 0x80 << (24 - l % 32);
        m[((l + 64 >> 9) << 4) + 15] = l;
        for (var i = 0; i < m.length; i += 16) {
            a = HASH[0];
            b = HASH[1];
            c = HASH[2];
            d = HASH[3];
            e = HASH[4];
            f = HASH[5];
            g = HASH[6];
            h = HASH[7];
            for (var j = 0; j < 64; j++) {
                if (j < 16) W[j] = m[j + i];
                else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
                T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
                T2 = safe_add(Sigma0256(a), Maj(a, b, c));
                h = g;
                g = f;
                f = e;
                e = safe_add(d, T1);
                d = c;
                c = b;
                b = a;
                a = safe_add(T1, T2);
            }
            HASH[0] = safe_add(a, HASH[0]);
            HASH[1] = safe_add(b, HASH[1]);
            HASH[2] = safe_add(c, HASH[2]);
            HASH[3] = safe_add(d, HASH[3]);
            HASH[4] = safe_add(e, HASH[4]);
            HASH[5] = safe_add(f, HASH[5]);
            HASH[6] = safe_add(g, HASH[6]);
            HASH[7] = safe_add(h, HASH[7]);
        }
        return HASH;
    }

    function str2binb(str) {
        var bin = Array();
        var mask = (1 << chrsz) - 1;
        for (var i = 0; i < str.length * chrsz; i += chrsz) {
            bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
        }
        return bin;
    }

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }

    function binb2hex(binarray) {
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
                hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
        }
        return str;
    }
    s = Utf8Encode(s);
    return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
}



function limitSell(formPointer) {

    //e.preventDefault();
    var frm = jQuery('#limit-sell');
    var formData = frm.serializeArray();
    formData.push({ name: 'userId', value: userId });
    formData.push({ name: 'session', value: session });

    jQuery.ajax({
        type: frm.attr('method'),
        url: 'http://' + SERVER_NAME + ':8002/sell',
        data: formData,
        success: function(data) {
            if (data == 'no funds') {
                alert('No funds');
            } else {
                //console.log(data);
            }
            //alert(data);
        },
        error: function(data) {
            console.log('An error occurred.');
            console.log(data);
        },
    });
}


function limitBuy(formPointer) {

    //e.preventDefault();
    var frm = jQuery('#limit-buy');
    var formData = frm.serializeArray();
    formData.push({ name: 'userId', value: userId });
    formData.push({ name: 'session', value: session });

    jQuery.ajax({
        type: frm.attr('method'),
        url: 'http://' + SERVER_NAME + ':8002/buy',
        data: formData,
        success: function(data) {
            if (data == 'no funds') { alert('No funds'); } else {
                //console.log(data);

            }
            //alert(data);
        },
        error: function(data) {
            console.log('An error occurred.');
            console.log(data);
        },
    });
}

function updateOTransactionsList(item, i, arr) {
    //console.log(item + ' ' + i);
    [price, amount, time] = item.split(".");
    var listHtml = jQuery('#trade-history').html();
    var str = templateHtmlTradeHistory;

    var lineDate = new Date(parseInt(time));

    // % is modulo which is the remainder after division || will change 0 to 12
    // because 0 is falsey everything else will be left as it is
    var hours = ("0" + ((lineDate.getHours() % 12) || 12)).substr(-2)
    // Minutes part from the timestamp
    var minutes = ("0" + lineDate.getMinutes()).substr(-2)
    // Seconds part from the timestamp
    var seconds = ("0" + lineDate.getSeconds()).substr(-2)

    // Will display time in 10:30:23 format
    var formattedTime = hours + ':' + minutes + ':' + seconds;

    listHtml = str.replace(/{price}/g, price)
        .replace(/{time}/g, formattedTime)
        .replace(/{amount}/g, amount) + listHtml;

    document.getElementById("trade-history").innerHTML = listHtml;

    jQuery('.trade-history-row:gt(100)').remove();
    /*articleCount = jQuery('#trade-history').children().length;
      while (articleCount > 20) {
          jQuery('trade-history div:last-child').remove();
          articleCount = jQuery('#trade-history').children().length;
      }
    */
}

function updateOrdersListData(dataObject, objectId) {

    // Final HTML variable as empty string
    var listHtml = "";

    // Loop through dataObject, replace placeholder tags
    // with actual data, and generate final HTML
    var cntr = 0;
    var isBuy = "";
    //dataObject.reverse();
    //console.log(dataObject);
    for (var key in dataObject) {
        cntr++;
        if (dataObject[key].IsBuy === true) {
            isBuy = "BUY";
        } else {
            isBuy = "SELL";
        }


        if (bookmark == "orders") str = templateHtmlOrderListOpen;
        if (bookmark == "orders_history") str = templateHtmlOrderListHistory;
        if (bookmark == "transactions_history") str = templateHtmlOrderListFunds;

        listHtml = str.replace(/{no}/g, cntr)
            .replace(/{price}/g, dataObject[key].Price)
            .replace(/{time}/g, convertTimestamp(dataObject[key].Time))
            .replace(/{amount}/g, dataObject[key].Amount)
            .replace(/{pair}/g, dataObject[key].Pair)
            .replace(/{type}/g, isBuy)
            .replace(/{total}/g, dataObject[key].Price * dataObject[key].Amount)
            .replace(/{status}/g, dataObject[key].Status) + listHtml;
    }

    // Replace the HTML of #list with final HTML
    //ordersListHeaderHtml +
    document.getElementById(objectId).innerHTML = listHtml;
}

/*Number.prototype.format = function(n, x, s, c) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
        num = this.toFixed(Math.max(0, ~~n));

    return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
};*/

function formatMoney(amount, decimalCount = 6, decimal = ".", thousands = ",") {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = amount < 0 ? "-" : "";

        let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
        let j = (i.length > 3) ? i.length % 3 : 0;

        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
        console.log(e)
    }
};

function numOnly(selector) {
    selector.value = selector.value.replace(/[^0-9]/g, '');
}

$(".data-picker").datepicker({ dateFormat: 'dd-M-yy' });
jQuery("#logOutButton").click(function() {

    var formData = [];
    formData.push({ name: 'userId', value: userId });
    formData.push({ name: 'session', value: session });
    alert('DONE!!! You are logged out!');
    session = "";
    userId = "";
    jQuery("#buy_button").hide()
    jQuery("#sell_button").hide()
    jQuery(".logInButton").show()
    jQuery('.dashboard-auth').removeClass('authorized');

    //document.getElementById('balanceETH').innerHTML = "-";
    jQuery('.balanceETH').html("-")
    jQuery('#balanceETH').html("-")

    jQuery('.balanceBTC').html("-")
    jQuery('#balanceBTC').html("-")


    jQuery.ajax({
        type: 'POST',
        url: 'http://' + SERVER_NAME + ':8008/logout',
        data: formData,
        success: function(data) {
            requestData();

        }
    });

});


$(document).ready(function() {

    if (session == "") {
        jQuery("#buy_button").hide()
        jQuery("#sell_button").hide()

        jQuery('.balanceETH').html("-")
        jQuery('#balanceETH').html("-")

        jQuery('.balanceBTC').html("-")
        jQuery('#balanceBTC').html("-")
    }

    window.onresize = function() {
        // d3.select('div#chart').call(resize);
        // chart.resize();
    };


});