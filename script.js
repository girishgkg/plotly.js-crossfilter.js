var resetFilters = null;

Papa.parse("data.csv", {
  download: true, skipEmptyLines: true, dynamicTyping: true, header: true,
  complete: function(parsed){

    //Helper
    function unpack(rows, key) {
        return rows.map(function(row) { return row[key]; });
    }

    //Crossfilter dimension and group setup
    var data = crossfilter(parsed.data),
      im = data.dimension(function(d) { return d["im_2015"]; }),
      ims = im.group(function(d) { return Math.floor(d / 5) * 5; }),
      gdp = data.dimension(function(d) { return d["gdp_2015"]; }),
      gdps = gdp.group(function(d) { return Math.floor(d / 5000) * 5000; }),
      country = data.dimension(function(d) { return d["Country Code"]; }),
      countries = country.group(function(d) { return d; });

    //DOM objects for rendering
    var hist_im = document.getElementById("hist_im"),
      hist_gdp = document.getElementById("hist_gdp"),
      map = document.getElementById("map");

    //save selected ranges, initialized to 'everything'
    var im_range =[-Infinity, Infinity],
      gdp_range =[-Infinity, Infinity],
      country_range = [];

    //create plots with placeholder series


    var all_im = {
        type: 'bar',
        x: ims.all().map(function(d) { return d.key; }),
        y: ims.all().map(function(d) { return d.value; }),
        marker: {color: '#DDD'},
        selected: { marker: {color: '#DDD'} }
      };

    var all_gdp = {
        type: 'bar',
        x: gdps.all().map(function(d) { return d.key; }),
        y: gdps.all().map(function(d) { return d.value; }),
        marker: {color: '#DDD'},
        selected: { marker: {color: '#DDD'} }
      };

    //define redraw to call on crossfilter
    function redraw(source) {

      if(source != "im") {
        Plotly.react(hist_im, [all_im, {
          type: 'bar',
          x: unpack(ims.all(), "key"),
          y: unpack(ims.all(), "value"),
          marker: {color: ims.all().map(function(d) {
              return im_range[0] < d.key && d.key< im_range[1] ? '#66F':'#CCF'; }) }
        }],
        {
          title: "Infant Mortality",
          yaxis: {"title": "# Countries"}, xaxis: {"title": "Mortality per 1,000 births"},
          width: 450, height: 300, margin: {r:20,b:40,t:80,l:40}, selectdirection: "h",
          barmode: "overlay", hovermode: false, showlegend: false, dragmode: "select"
        })
      }

      Plotly.relayout(hist_im, {
        shapes: !isFinite(im_range[0]) ? null : [{
            type: 'rect', xref: 'x', yref: 'paper',
            x0: im_range[0], x1: im_range[1], y0: 0, y1: 1,
            fillcolor: '#d3d3d3', opacity: 0.2, line: { width: 0 }
        }]
      });

      if(source != "gdp") {
        Plotly.react(hist_gdp, [all_gdp, {
          type: 'bar',
          x: unpack(gdps.all(), "key"),
          y: unpack(gdps.all(), "value"),
          marker: {color: gdps.all().map(function(d) {
            return gdp_range[0] < d.key && d.key < gdp_range[1] ? '#66F':'#CCF'}) }
        }],
        {
          title: "GDP per Capita",
          yaxis: {"title": "# Countries"}, xaxis: {"title": "current USD"},
          width: 450, height: 300, margin: {r:20,b:40,t:80,l:40}, selectdirection: "h",
          barmode: "overlay", hovermode: false, showlegend: false, dragmode: "select"
        })
      }

      Plotly.relayout(hist_gdp, {
        shapes: !isFinite(gdp_range[0]) ? null : [{
            type: 'rect', xref: 'x', yref: 'paper',
            x0: gdp_range[0], x1: gdp_range[1], y0: 0, y1: 1,
            fillcolor: '#d3d3d3', opacity: 0.2, line: { width: 0 }
        }]
      });

      if(source != "map") {
        Plotly.react(map, [{
          type: 'choropleth',
          locationmode: 'ISO-3',
          locations: unpack(countries.all(), "key"),
          z: countries.all().map(function(d){
            if(d.value == 0) return 0;
            if(country_range.length == 0) return 1;
            return country_range.indexOf(d.key) != -1 ? 1 : 0.5}),
          showscale: false, zmin: 0, zmax: 1,
          colorscale: [ [0, '#DDD'], [0.5, '#CCF'], [1, '#66F'] ]
        }],
        {
          dragmode: "lasso", margin: {r:0,b:0,t:0,l:0}, height: 250,
          geo: { projection: { type: 'robinson' } }
        })
      }
    }

    //do the initial draw with no filters
    redraw();

    function doReact(f) { return function(e) { f(e, true ) } };
    function noReact(f) { return function(e) { f(e, false) } };


    //set up selection listeners
    function hist_im_select(e, react) {
      im_range = e ? [e.range.x[0], e.range.x[1]] : [-Infinity, Infinity];
      im.filter(im_range);
      redraw(react ? null: "im");
    }

    hist_im.on('plotly_selected',  doReact(hist_im_select));
    hist_im.on('plotly_doubleclick',  doReact(hist_im_select));
    hist_im.on('plotly_selecting', noReact(hist_im_select));

    function hist_gdp_select(e, react) {
      gdp_range = e ? [e.range.x[0], e.range.x[1]] : [-Infinity, Infinity];
      gdp.filter(gdp_range);
      redraw(react ? null: "gdp");
    }
    hist_gdp.on('plotly_selected',  doReact(hist_gdp_select));
    hist_gdp.on('plotly_doubleclick',  doReact(hist_gdp_select));
    hist_gdp.on('plotly_selecting', noReact(hist_gdp_select));

    function map_select(e, react) {
      if(e && e.points.length != 0) {
        country_range = unpack(e.points, "location");
        country.filter(function(d) {return country_range.indexOf(d) != -1;})
      }
      else {
        country_range = []
        country.filterAll();
      }
      redraw(react ? null: "map");
    }

<<<<<<< HEAD
    map.on('plotly_selected', map_select);
    map.on('plotly_selecting', map_select);
=======
    map.on('plotly_selected',  doReact(map_select));
    map.on('plotly_selecting', noReact(map_select));
>>>>>>> finishing react version

    resetFilters = function() {
      gdp_range = [-Infinity, Infinity];
      im_range = [-Infinity, Infinity];
      country_range = [];
      im.filter(im_range);
      gdp.filter(gdp_range);
      country.filterAll();
      redraw();
    };


  }
});
