/*
------------------------------------------------------------------------------->

TITLE: Generate network diagram
AUTHOR: Nat Henry, nat@henryspatialanalysis.com
CREATED: January 15, 2026

------------------------------------------------------------------------------->
*/

// Identify the div to be filled and create an SVG within it
const div_id = '#network-chart';
const district_hierarchy = {
  "Central": ["Lilongwe", "Dowa", "Kasungu", "Nkhotakota"],
  "Southern": ["Chikwawa", "Nsanje", "Mulanje"],
}
const div_height = d3.select(div_id).node().getBoundingClientRect().height,
      div_width = d3.select(div_id).node().getBoundingClientRect().width;
const svg = d3.select(div_id)
  .append('svg:svg')
    .attr('height', div_height)
    .attr('width', div_width);


// Setup ---------------------------------------------------------------------->

// Set time for all transitions, in milliseconds
const transition_time = 300;

// Define a tooltip that will appear when mousing over a point
var tooltip = d3.select(div_id)
  .append("div")
  .attr('class','tooltip')
    .style('position', 'absolute')
    .style('font', '12px sans-serif')
    .style('line-height', 1.5)
    .style('background', '#ddd')
    .style('padding', '5px')
    .style('padding-bottom', '10px')
    .style('border', '0px')
    .style('border-radius', '8px')
    .style('opacity', 0.);

// Function to define "opening" the tooltip
function open_tooltip(d){
  if(d.Region === null) return;

  // Set up x marker (to indicate that the tooltip can be closed by clicking)
  const x_style = "style='padding:0; margin:0 0 -5px 0; text-align:right; font:3px;'";
  var inner_html = "<div " + x_style + ">x</div>";
  // Set up styling for any titles
  const h3_style = "style='text-align:center; margin:0 0 5px 0; padding:0;'";

  inner_html += "<h3 " + h3_style + ">" + d.name + "</h3>" +
                "<i>District:</i> " + d.District + "<br/>" +
                "<i>Region:</i> " + d.Region + "<br/>";
  tooltip.style('text-align', 'left');
  tooltip
    .html(inner_html)
    .style('left', (d3.event.pageX) + 'px')
    .style('top', (d3.event.pageY) + 'px')
    .transition(transition_time)
      .style('opacity', 0.9);
}

// Function to define "closing" the tooltip
tooltip.on('click', function(_){
  tooltip.style('opacity', 0.0);
  tooltip.html('');
});


// Create the force-directed diagram ------------------------------------------>

// Set color scheme
// Color scheme inspired by Color Brewer: https://colorbrewer2.org/
const vir_names = ['Community viraemia >= 1%', 'Community viraemia < 1%'];
const vir_colors = ['#e41a1c', '#377eb8'];
const col_scale = d3.scaleOrdinal(vir_colors).domain(vir_names);

// Define the force-directed diagram
const simulation = d3.forceSimulation(network_data.nodes)
  .force("charge", d3.forceManyBody().strength(-200))
  .force(
    "link",
    d3.forceLink(network_data.links)
      .id(d => d.id)
      .distance(30)
      .strength(.2)
    )
  .force("center", d3.forceCenter(div_width / 2 + 30, div_height / 2 + 30))
  .force("x", d3.forceX())
  .force("y", d3.forceY());

// Set the behavior for dragging a node
function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.5).restart();
  d.fx = d.x;
  d.fy = d.y;
}
function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}
function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// Visualize links between nodes
const link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
  .selectAll("line")
    .data(network_data.links)
    .join("line");

// Visualize nodes as circles
const node = svg.append("g")
    .attr('class', 'node-point')
    .attr("stroke-width", 1.)
  .selectAll("circle")
  .data(network_data.nodes)
  .join("circle")
    .attr("stroke", d => d.Region === null ? '#000' : '#AAA')
    .attr("fill", d => d.Viraemia === null ? '#000' : col_scale(d.Viraemia))
    .attr("r", d => d.Region === null ? 10 : 5)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on('click', d => open_tooltip(d));

var node_label = svg
  .append('g')
    .attr('class', 'node-label')
  .selectAll('text')
  .data(network_data.nodes)
  .join('text')
    .text(d => (d.Region === null) ? d.name : null)
    .attr('x', d => (d.Region === null) ? d.x + 8 : d.x + 5)
    .attr('y', d => (d.Region === null) ? d.y - 15 : d.y - 10)
    .style('font', '10px sans-serif')
    .style('fill', '#555')
    .style('background-color', '#ffffff88')
    .style('pointer-events', 'none');

// Update points over time
simulation.on("tick", () => {
  link
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

  node
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  node_label
    .attr('x', d => (d.Region === null) ? d.x + 8 : d.x + 5)
    .attr('y', d => (d.Region === null) ? d.y - 15 : d.y - 10);
});


// Add legend and highlighting buttons ---------------------------------------->

// Create div that will store the legend and focus buttons
var viz_guide = d3.select(div_id)
  .append('div')
    .style('position', 'absolute')
    .style('top', '10px')
    .style('left', '10px')
    .style('margin', 0)
    .style('padding', '5px')
    .style('background', 'white')
    .style('opacity', 0.85);

// Add legend
const legend_font_style = '10px sans-serif';

var legend = viz_guide
  .append('svg:svg')
    .style('margin', 0)
    .style('height', '40px')
    .style('width', '150px')
    .style('padding', 0);

legend.selectAll('legend_dots')
  .data(vir_names)
  .enter()
  .append('circle')
    .attr('cx', 10)
    .attr('cy', function(_, i){ return(10 + i * 18) })
    .attr('r', 5)
    .style('fill', d => col_scale(d));
legend.selectAll('legend_labels')
  .data(vir_names)
  .enter()
  .append('text')
    .attr('x', 20)
    .attr('y', function(_, i){ return(12 + i * 18) })
    .style('fill', d => col_scale(d) )
    .style('font', legend_font_style)
    .text(d => d)
    .attr('text-anchor', 'left')
    .style('alignment-baseline', 'middle');

// Function to reduce the opacity of all patron nodes where a particular
//  condition is false
function focus_grouping(district_name){
  node
    .transition(transition_time)
    .style('opacity', d =>
      d.Region === null ? 1.0 :
      d.District == district_name ? 1.0 : 0.2
    );
}
// Function to only show named entities in the NYT article
function focus_named(){
  node
    .transition(transition_time)
    .style('opacity', d =>
      (d.data.display_name == "") ? 0.2 : 1.0
    );
}
// Add focus buttons
var focus_buttons = viz_guide
  .append('div')
    .style('font', legend_font_style)
    .style('text-align', 'center')
focus_buttons.append('h3')
  .style('margin', '10px 0 5px 0')
  .html('Focus on:')

function add_focus_button(button_title, bg_color, focus_func){
  focus_buttons
    .append('button')
    .style('font', legend_font_style)
    .style('background-color', bg_color)
    .style('width', '120px')
    .style('height', '20px')
    .style('padding', '0px')
    .html(button_title)
    .on('click', () => focus_func());
  focus_buttons.append('br');
}

for(const region of Object.keys(district_hierarchy)){
  for(const district of district_hierarchy[region]){
    add_focus_button(district, '#CCC', () => focus_grouping(district));
  }
}
add_focus_button(
  '<i>Clear focus</i>',
  '#888',
  () => node.transition(transition_time).style('opacity', 1.)
);
