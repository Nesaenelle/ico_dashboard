function Chart() {
    this.chart = undefined; // global
    this.set_course = undefined;
    this.bookmark = "orders"; //orders_history, transactions_history
    this.set_volume = undefined;
    this.set_open = undefined;
    this.set_close = undefined;
    this.set_high = undefined;
    this.set_low = undefined;
    this.userOrders = [];
    this.userOrdersHistory = [];
    this.userTransactionsHistory = [];
    this.feed = [];
    //var userTransactionsHistory=[];
}

Chart.prototype.init = function() {
    var margin = { top: 20, right: 50, bottom: 30, left: 50 },
        width = 800 - margin.left - margin.right,
        height = 460 - margin.top - margin.bottom;
    width = jQuery('.dashboard-block.dashboard-chart').width() - margin.left - margin.right;
    height = jQuery('.dashboard-block.dashboard-chart').height() - margin.top - margin.bottom - jQuery('.dashboard-chart__panel.dashboard-block__inner').height();

    //var parseDate = d3.timeFormat("%d-%b-%y %H:%M:%S");
    //var parseDate2 = d3.timeParse("%d-%b-%y");

    this.x = techan.scale.financetime()
        .range([0, width]);


    this.y = d3.scaleLinear()
        .range([height, 0]);

    this.yVolume = d3.scaleLinear()
        .range([this.y(0), this.y(0.2)]);

    this.ohlc = techan.plot.candlestick()
        .xScale(this.x)
        .yScale(this.y);

    this.sma0 = techan.plot.sma()
        .xScale(this.x)
        .yScale(this.y);

    this.sma0Calculator = techan.indicator.sma()
        .period(10);

    this.sma1 = techan.plot.sma()
        .xScale(this.x)
        .yScale(this.y);

    this.sma1Calculator = techan.indicator.sma()
        .period(20);

    this.volume = techan.plot.volume()
        .accessor(this.ohlc.accessor()) // Set the accessor to a ohlc accessor so we get highlighted bars
        .xScale(this.x)
        .yScale(this.yVolume);

    this.xAxis = d3.axisBottom(this.x);

    this.yAxis = d3.axisRight(this.y);
    //var yAxis = d3.axisRight(y);

    this.volumeAxis = d3.axisRight(this.yVolume)
        .ticks(3)
        .tickFormat(d3.format(",.3s"));

    this.timeAnnotation = techan.plot.axisannotation()
        .axis(this.xAxis)
        .orient('bottom')
        .format(d3.timeFormat('%Y-%m-%d %H:%M'))
        .width(100)
        .translate([0, height]);

    this.ohlcAnnotation = techan.plot.axisannotation()
        .axis(this.yAxis)
        .orient('right')
        .translate([this.x(1), 0])
        //.translate([0, height])
        .format(d3.format(',.2f'));

    this.closeAnnotation = techan.plot.axisannotation()
        .axis(this.yAxis)
        .orient('right')
        .accessor(this.ohlc.accessor())
        .format(d3.format(',.2f'))
        .translate([this.x(1), 0]);

    this.volumeAnnotation = techan.plot.axisannotation()
        .axis(this.volumeAxis)
        .orient('right')
        .width(35);



    this.svg = d3.select("div#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var defs = this.svg.append("defs");

    defs.append("clipPath")
        .attr("id", "ohlcClip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    this.svg = this.svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    this.svg.append("g")
        .attr("class", "volume axis");



    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");

    this.svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + this.x(1) + ",0)")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")

        .style("text-anchor", "end")
        .text("Price ($)");


    this.coordsText = this.svg.append('text')
        .style("text-anchor", "end")
        .attr("class", "coords")
        .attr("x", width - 5)
        .attr("y", 15);


    this.accessor = this.ohlc.accessor();


    var ohlcSelection = this.svg.append("g")
        .attr("class", "candlestick")
        .attr("transform", "translate(0,0)");

    ohlcSelection.append("g")
        .attr("class", "volume")
        .attr("clip-path", "url(#ohlcClip)");

    ohlcSelection.append("g")
        .attr("class", "candlestick")
        .attr("clip-path", "url(#ohlcClip)");

    ohlcSelection.append("g")
        .attr("class", "indicator sma ma-0")
        .attr("clip-path", "url(#ohlcClip)");

    ohlcSelection.append("g")
        .attr("class", "indicator sma ma-1")
        .attr("clip-path", "url(#ohlcClip)");

    ohlcSelection.append("g")
        .attr("class", "close annotation up");


    this.crosshair = techan.plot.crosshair()
        .xScale(this.x)
        .yScale(this.y)
        .xAnnotation(this.timeAnnotation)
        .yAnnotation([this.ohlcAnnotation, this.volumeAnnotation])
        .on("move", this.move.bind(this));


    this.svg.append('g')
        .attr("class", "crosshair ohlc");
}

Chart.prototype.move = function(coords) {
    this.coordsText.text(
        this.timeAnnotation.format()(coords.x) + ", " + this.ohlcAnnotation.format()(coords.y)
    );
}

Chart.prototype.setSize = function() {
    d3.select("svg").remove();
    this.init();
}

Chart.prototype.resize = function() {
    this.setSize();
    this.redraw();
}

Chart.prototype.setBookmark = function(value) {
    this.bookmark = value;
}

Chart.prototype.redraw = function() {
    // var accessor = this.ohlc.accessor();
    var self  = this;
    var data = this.feed;
    this.x.domain(data.map(this.accessor.d));
    // Show only 150 points on the plot
    this.x.zoomable().domain([data.length - 130, data.length]);



    // Update y scale min max, only on viewable zoomable.domain()
    this.y.domain(techan.scale.plot.ohlc(data.slice(data.length - 130, data.length)).domain());
    this.yVolume.domain(techan.scale.plot.volume(data.slice(data.length - 130, data.length)).domain());

    // Setup a transition for all that support
    this.svg
        //          .transition() // Disable transition for now, each is only for transitions
        .each(function() {
            var selection = d3.select(this);
            selection.select('g.x.axis').call(self.xAxis);
            selection.select('g.y.axis').call(self.yAxis);
            selection.select("g.volume.axis").call(self.volumeAxis);

            selection.select("g.candlestick").datum(data).call(self.ohlc);
            selection.select("g.sma.ma-0").datum(self.sma0Calculator(data)).call(self.sma0);
            selection.select("g.sma.ma-1").datum(self.sma1Calculator(data)).call(self.sma1);
            selection.select("g.volume").datum(data).call(self.volume);

            self.svg.select("g.crosshair.ohlc").call(self.crosshair);
        });

    //svg.selectAll("g.y.annotation.right").datum(data[data.length-1]).call(closeAnnotation);
    //svg.select("g.close.annotation").datum([data[data.length-1]]).call(closeAnnotation);

    // Set next timer expiry
    /* setTimeout(function() {
        var newData;

        if(data.length < feed.length) {
            // Simulate a daily feed
            newData = feed.slice(0, feed.length);
        }
        else {
    data.shift();
            data.push({
      date: new Date(),
      open: set_open,
      high: set_high,
      low: set_low,
      close: set_close,
      volume: set_volume
    });

    svg.select("g.close.annotation").datum([data[data.length-1]]).call(closeAnnotation);


            newData = data;
        }

        redraw(newData);
    }, (Math.random()*1000*60)); // Randomly pick an interval to update the chart
*/
}

Chart.prototype.addRow = function (data) {
    var $ = jQuery.noConflict();
    var self = this;
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
        this.feed.push({
            date: d,
            open: set_open,
            high: set_high,
            low: set_low,
            close: set_close,
            volume: set_volume
        });
        this.feed.sort(function(a, b) { return d3.ascending(self.accessor.d(a), self.accessor.d(b)); });
        start_counter = start_counter + 1;
        if (start_counter >= 130) {
            this.redraw();
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
        this.feed.push({
            date: d,
            open: set_open,
            high: set_high,
            low: set_low,
            close: set_close,
            volume: set_volume
        });
        this.feed.sort(function(a, b) { return d3.ascending(self.accessor.d(a), self.accessor.d(b)); });

        this.redraw();
        this.svg.select("g.close.annotation").datum([this.feed[this.feed.length - 1]]).call(this.closeAnnotation);

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

        d = this.feed[this.feed.length - 1].date;
        //d.setSeconds(0,0);

        this.feed.pop();
        this.feed.push({
            date: d,
            open: set_open,
            high: set_high,
            low: set_low,
            close: set_close,
            volume: set_volume
        });

        this.redraw();
        this.svg.select("g.close.annotation").datum([this.feed[this.feed.length - 1]]).call(this.closeAnnotation);

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
            this.userOrders[no_isBuy] = { Amount: amount, IsBuy: isBuy, Pair: pair, Price: price, Status: status, Time: time };

        }

        if (actionType == "ADD_HO") {
            this.userOrdersHistory[no_isBuy] = { Amount: amount, IsBuy: isBuy, Pair: pair, Price: price, Status: status, Time: time };
            delete this.userOrders[no_isBuy];
        }

        if (actionType == "ADD_HT") {
            this.userTransactionsHistory[no_isBuy] = { Amount: amount, IsBuy: isBuy, Pair: pair, Price: price, Status: status, Time: time };
        }

        //,UB,0,ETH,10031,12,506
        //[course, actionType, no_isBuy, lo_id, lo_amount, lo_price, no_id, no_amount, no_price] = data.split(",");
        //balanceCurrency = lo_id;
        //balanceAmount = lo_amount;
        //document.getElementById('balance' + balanceCurrency).innerHTML = balanceAmount;
        if (this.bookmark == "orders") updateOrdersListData(this.userOrders, 'orders-list-open');
        if (this.bookmark == "orders_history") updateOrdersListData(this.userOrdersHistory, 'orders-list-history');
        if (this.bookmark == "transactions_history") updateOrdersListData(this.userTransactionsHistory, 'transactions-list-history');

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


window.DashboardChart = Chart;
// chart.init();

// redraw(feed.slice(feed.length - 130, feed.length));


