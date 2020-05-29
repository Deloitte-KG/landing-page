'use strict';

/**
 * Settings and Initialisation
 */	
var use_cache = false;

var width = window.innerWidth * 1 - 50;
var height = window.innerHeight * 1;

var reports = new Array(
	'Report FINREP',
	'Report AnaCredit',
	'Report COREP'
);

var allowed_subject_areas = new Array(
	'Accounting', 
	'Involved party',
	'Product', 
	'Arrangement', 
	'Collateral', 
	'Amounts', 
	'Resource item');
	
var relations = new Array(
	'is a kind of',
	'is a member of',
	'belongs to',
	'is a feature of',
	'is a synonym of',
	'is a part of',
	'is input for',
	'classifies',
	'is a required part of',
	'is represented by',
	'is an output from',
	'is a result of',
	'provides',
	'is a role of', 
	'reporting',
	'other');

var selected_reports = reports;
var selected_relations = relations;
var selected_subject_areas = allowed_subject_areas;

var compl;
var dict_autocompl;

var show_sub_areas =false;				
var show_reports =false;
var selected_tab;

// Define color scales for subject areas and relations
var CS_subjarea = ["#2c7bb6", "#00a6ca","#00ccbc","#90eb9d","#ffff8c","#f9d057","#f29e2e","#d7191c",'#FF6700','#ffff00'];
var c1 = d3.scaleOrdinal(CS_subjarea).domain(allowed_subject_areas);
var c2 = d3.scaleOrdinal(d3.schemeCategory20).domain(relations);

/**
 * Force Initialisation
 */	
var f = {
	'chargeStrength': -10,
	'linkDistance': 80
}
// Keep a reference to the force
var forceLink = d3.forceLink()      
	.id(function(d) { return d.id; })
	.distance(function(d, i){
		return f.linkDistance + ((i % 10) + 1) * f.linkDistance/3;
	})
	
var force = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(f.chargeStrength))
	.force("center", d3.forceCenter(1.3 * width / 2, height / 2)) 
	.force("link", forceLink)
	.force("y", d3.forceY(0))
	.force("x", d3.forceX(2))

var links_group,
	links,
	links_txt,
	nodes_group,
	nodes,
	nodes_txt,
	active_node,
	dataset = {
		'nodes': new Array(),
		'links': new Array()
	}	
	
// Get selected Relations
function get_relations(){
	var inputs = document.querySelectorAll('#legend-lines input[type="checkbox"]'); 
	var output = new Array();
	
	for(var i = 0; i < inputs.length; i++){
		if(inputs[i].checked){
			output.push(inputs[i].value);
		}
	}
	return output;	
}

// Get selected Nodes
function get_nodes(){
	var inputs = document.querySelectorAll('#legend input[type="checkbox"]'); 
	var output = new Array();
	
	for(var i = 0; i < inputs.length; i++){
		if(inputs[i].checked){
			output.push(inputs[i].value);
		}
	}	
	return output;	
}

// Get selected Reports
function get_reports(){
	var inputs = document.querySelectorAll('#legend-reports input[type="checkbox"]'); 
	var output = new Array();
	
	for(var i = 0; i < inputs.length; i++){
		if(inputs[i].checked){
			output.push(inputs[i].value);
		}
	}	
	return output;	
}

/*----------------------------------------------------------------------*/
//Drag functions
/*----------------------------------------------------------------------*/  
function dragstarted(d) {
	if (!d3.event.active) force.alphaTarget(1).restart();
	d.fx = d.x;
	d.fy = d.y;
}
	
function dragged(d,i) {
	//start of check for opened menu
	// if(menuOpen == false){ 
		// d.fx = Math.max(radius(d, i), Math.min(width  - radius(d, i), d3.event.x));
	// } else{
		// var menuSize = d3.select('.expl').style("width")
		// d.fx = Math.max(radius(d, i) + menuSize, Math.min(width  - radius(d, i), d3.event.x));
	// }
	d.fx = Math.max(radius(d, i), Math.min(width  - radius(d, i), d3.event.x));
	d.fy = Math.max(radius(d, i), Math.min(height - radius(d, i), d3.event.y));
}

function dragended(d) {
	if (!d3.event.active) force.alphaTarget(0);
	d.fx = d.x;
	d.fy = null;
}

var dragfunc = d3.drag()
	.on("start", dragstarted)
	.on("drag", dragged)
	.on("end", dragended);	  

/*----------------------------------------------------------------------*/
//Shape and style of nodes/links
/*----------------------------------------------------------------------*/
var rad_std = 15;
function radius(d, i){
	if(d.is_parent){
		return 50;
	}else if(d.is_leaf == true){
		return 5;
	}else{
		return rad_std;
	}
}

function node_fill(d, i){
	return c1(d.subject_area);	
}

function node_stroke(d, i){
	return d3.rgb(c1(d.subject_area)).darker(1);
}

function line_stroke(d, i){
	if(relations.indexOf(d.type) == -1 || d.type == 'other'){
		return '#aaa';
	}
	return c2(d.type);
}

function opacity(d, i){
	return 1;
}

function node_stroke_width(d, i){
	if(d.is_parent){
		return 5;
	}else if(!d.is_leaf){
		return 3;
	}else{
		return 0;
	}
}

function linewidth(d, i){
	return 4;
}

function dasharray(d, i){
	if(relations.indexOf(d.type) == -1){
		return '7,5'
	} else if(d.type == 'is a kind of'){
		return '1,0'
	}else if(d.type == 'is a kind of'){
		return '3,3'
	}else if(d.type == 'is a member of'){
		return '5,5'
	}else if(d.type == 'belongs to'){
		return '7,7'
	}else if(d.type == 'is a feature of'){
		return '9,9'
	}else if(d.type == 'is a synonym of'){	
		return '3,1'	
	}else if(d.type == 'is a part of'){	
		return '3,5'	
	}else if(d.type == 'is input for'){	
		return '3,7'	
	}else if(d.type == 'classifies'){	
		return '3,9'
	}else if(d.type == 'is a required part of'){
		return '5,1'
	}else if(d.type == 'is represented by'){
		return '5,3'
	}else if(d.type == 'is an output from'){
		return '5,7'
	}else if(d.type == 'is a result of'){
		return '5,9'
	}else if(d.type == 'provides'){
		return '7,1'	
	}else if(d.type == 'is a role of'){		
		return '7,3'	
	}else if(d.type == 'reporting'){		
		return '5, 5, 1, 5'
	}else{
		return '7,5'		
	}
}

/*----------------------------------------------------------------------*/
//Shape of links 
/*----------------------------------------------------------------------*/
function drawCurve(d) {
    var sourceX = d.source.x;
    var sourceY = d.source.y;
    var targetX = d.target.x;
    var targetY = d.target.y;

    var theta = Math.atan((targetX - sourceX) / (targetY - sourceY));
    var phi = Math.atan((targetY - sourceY) / (targetX - sourceX));

    var sinTheta = d.source.r * Math.sin(theta);
    var cosTheta = d.source.r * Math.cos(theta);
    var sinPhi = d.target.r * Math.sin(phi);
    var cosPhi = d.target.r * Math.cos(phi);
	
    // Set the position of the link's end point at the source node
    // such that it is on the edge closest to the target node
    if (d.target.y > d.source.y) {
        sourceX = sourceX + sinTheta;
        sourceY = sourceY + cosTheta;
    }
    else {
        sourceX = sourceX - sinTheta;
        sourceY = sourceY - cosTheta;
    }

    // Set the position of the link's end point at the target node
    // such that it is on the edge closest to the source node
    if (d.source.x > d.target.x) {
        targetX = targetX + cosPhi;
        targetY = targetY + sinPhi;    
    }
    else {
        targetX = targetX - cosPhi;
        targetY = targetY - sinPhi;   
    }

    // Draw an arc between the two calculated points
    var dx = targetX - sourceX,
        dy = targetY - sourceY,
        dr =  3 * Math.sqrt(dx * dx + dy * dy);
    return "M" + sourceX + "," + sourceY + "A" + dr + "," + dr + " 0 0,1 " + targetX + "," + targetY;
}

/*----------------------------------------------------------------------*/
// Function to add fuzzy search in dictionairy
/*----------------------------------------------------------------------*/

/**
 * Method called on every change in layout
 */
var ticked = function() {
	
	var direction = new Array();
	
	//place where text is drawn -1 for right, 1 for left
	links.attr("d", function(d, i){		
		if(d.source.x < d.target.x ){
			direction[d.target.id] = 1;
		}else{
			direction[d.target.id] = -1;
		}
		return drawCurve(d);		
	});
		
	//position of nodes
	nodes.attr("transform", function (d) {return "translate(" + d.x + "," + d.y + ")" })
		 .attr("cx", function(d, i) { return d.x = Math.max(radius(d, i), Math.min(width  - radius(d, i), d.x)); }) 
		 .attr("cy", function(d, i) { return d.y = Math.max(radius(d, i), Math.min(height - radius(d, i), d.y)); });
		
	
	//position of text next to nodes
	nodes_txt.attr('dx', function(d, i) { 
			if(d.is_parent){
				return d.x - this.getComputedTextLength()/2;  
			}else{
				if(typeof direction[d.id] == "undefined" ){
					direction[d.id] = 1;
				}
				return d.x  + direction[d.id] * (  radius(d, i) + 5 );
			}	
			})
		.attr('dy', function(d, i) { return d.y + 5})
		.attr('text-anchor', function(d, i){
			if(direction[d.id] == -1 && d.is_parent == false){
				return 'end'
			}else{
				return 'start'
			}
		});  
}
/**
 * Function to collpse and expand legends on click
 */
function toggle(){	
	if(d3.select(this).select('span a').html() == '▴'){
		d3.select(this).select('span a').html('&#x25BE;')
		d3.select(this.parentNode).selectAll('.select-div')
			.style('height', 0)
			.style('overflow', 'hidden');
		d3.select(this.parentNode).selectAll('ul')
			.style('height', 0)
			.style('overflow', 'hidden');		}
	else{
		d3.select(this).select('span a').html('&#x25B4;')
		d3.select(this.parentNode).selectAll('.select-div')
			.style('height', 'auto')
			.style('overflow', null);
		d3.select(this.parentNode).selectAll('ul')
			.style('height', 'auto')
			.style('overflow', null);			
	}			
}

/**
 * Function to dynamically load context menu items
 */
function getMenuItems(data){
	var sub_area = data.subject_area.toLowerCase();
	var clicked_term = data.term;
	if(typeof data.report === 'undefined'){
				//menu which is opened on right click of node-text
				return [
					{
						title:'4. Logical Data Model',
						action:function(elem,i){
							//convert all spaces to '_' to match html file names
							location.href = sub_area.split(' ').join('_')+'_ldm.html?search='+encodeURI(clicked_term);
						}	
					},
					{
						title:'5. Physical Data Model',
						action:function(elem,i){
							location.href = sub_area.toLowerCase().split(' ').join('_')+'_pdm.html?search='+encodeURI(clicked_term);
						}
					},
					{
						title:'4.1 BIM<span style="font-weight:bold"> logical</span> reporting model',
						action:function(elem,i){
							location.href = 'dim_ldm.html?search='+encodeURI(clicked_term);
						}
					},
					{
						title:'5.1 BIM<span style="font-weight:bold"> phsyical</span>  reporting model',
						action:function(elem,i){
							location.href = 'dim_pdm.html?search='+encodeURI(clicked_term);  
						}
					}					
				];
	}
	else{
		var temp = [];	
		var menuObjects =[];
		//Regex to find everything except the starting letter from reference
		var re = /[^A-Z]+\d{1,2}/g;
		//Append 000 as column co-ordinate for row reference
		if(data.rowRef){
			var m = data.rowRef.match(re);
			for (var i=0;i<m.length;i++){
				temp.push(m[i]+':000')				
			}
		}
		//Append 000 as row reference for Column reference
		if(data.colRef){
			var n = data.colRef.match(re);
			for (var i=0;i<n.length;i++){
				temp.push(n[i].replace(':',':000:'))				
			}
		}
		//On selecting one of the item in menu navigate to reporting template mentioned in selected item 
		for(var i=0 ; i < temp.length;i++){
		var	menuOb = {
				title:temp[i],
				action:function(elem,d,i){
					location.href = 'tableLayoutFINREP.html?search='+ encodeURI(d.title);
				}
			};
			menuObjects.push(menuOb)
		}
		return menuObjects;
	}
}
/**
 * Function to open context menu on right click of node-text
 */
 d3.contextMenu = function (menu, openCallback) {

		// create the div element that will hold the context menu
		d3.selectAll('.d3-context-menu').data([1])
		.enter()
		.append('div')
		.attr('class', 'd3-context-menu');
	
		// close menu
		d3.select('body').on('click.d3-context-menu', function() {
			d3.select('.d3-context-menu').style('display', 'none');
		});
	
		// this gets executed when a contextmenu event occurs
		return function(data, index) {	
			var menu = getMenuItems(data);
			var elm = this;
			d3.selectAll('.d3-context-menu').html('');
			var list = d3.selectAll('.d3-context-menu').append('ul');
			list.selectAll('li').data(menu).enter()
				.append('li')
				.html(function(d) {
					return d.title;
				})
				.on('click', function(d, i) {
					d.action(elm,d,i);
					d3.select('.d3-context-menu').style('display', 'none');
				});
	
			// the openCallback allows an action to fire before the menu is displayed
			// an example usage would be closing a tooltip
			if (openCallback) openCallback(data, index);
	
			// display context menu
			d3.select('.d3-context-menu')
				.style('left', (d3.event.pageX - 2) + 'px')
				.style('top', (d3.event.pageY - 2) + 'px')
				.style('display', 'block');
	
			d3.event.preventDefault();
		};
	};
/**
 * This event handler is triggered whenever DOM is ready with resources
 */
window.onload = function(){
	// Use time parameter to avoid caching
	if(use_cache === false){
		var tx = new Date().getTime();
	}else{
		var tx = '';
	}
	
	//read in data, queue loads asynchronous (all at the same time but order is maintained)
	d3.queue()		
		.defer(d3.csv, "data/rel_4.csv?t=" + tx)
		.defer(d3.csv, "data/terms_8.csv?t=" + tx)
		.defer(d3.csv, "data/finrep_2.csv?t=" + tx)
		.defer(d3.csv, "data/finrep-reference.csv?t=" + tx)
		.defer(d3.csv, "data/anacredit.csv?t=" + tx)
		.defer(d3.csv, "data/anacreditterms.csv?t=" + tx)	
		.defer(d3.csv, "data/corep.csv?t=" + tx)
		.defer(d3.csv, "data/corepterms.csv?t=" + tx)		
		.await(render); ///////////////////////////////
	
	//function that makes menu collapse
	d3.select('.collapse>a').on('click', function(d, i){
		if(d3.select(this).html() == '◀'){
			d3.select(this).html('&#x25B6;')
			d3.select('#expl')
				.transition()
				.duration(250)
				.style('left', (-d3.select('#expl').node().getBoundingClientRect().width + 75) + 'px');
		}else{
			d3.select(this).html('&#x25C0;')
			d3.select('#expl')
				.transition()
				.duration(250)
				.style('left', '0px');
		}
	});

	d3.selectAll('.report').on('click', toggle);	
	d3.selectAll('.subject-area').on('click',toggle);
	d3.selectAll('.relation').on('click', toggle);
}
			
/**
 * Awaited until all the data is been loaded in d3.queue
 * @param {String} error 
 * @param {Array} data 
 * @param {Array} terms 
 * @param {Array} finrep_data 
 * @param {Array} finrepterms 
 * @param {Array} anacredit_data 
 * @param {Array} anacreditterms 
 */			
function render(error, data, terms, finrep_data, finrepterms, anacredit_data, anacreditterms,corep_data,corepterms){

	var unique_data = new Array();
	var unique_terms = new Array();
	
	
	//Save of variable that stores whether menu is open or not \\ Code is duplicated from window.onload
	var menuOpen = true 
	d3.select('.collapse>a').on('click', function(d, i){
		if(d3.select(this).html() == '◀'){
			d3.select(this).html('&#x25B6;')
			d3.select('#expl')
				.transition()
				.duration(250)
				.style('left', (-d3.select('#expl').node().getBoundingClientRect().width + 75) + 'px');
			menuOpen = false
		}else{
			d3.select(this).html('&#x25C0;')
			d3.select('#expl')
				.transition()
				.duration(250)
				.style('left', '0px');
			menuOpen = true
		}
	});

	// Find unique nodes:
	for(var i = 0; i < data.length; i++){
		
		for(var j = 0; j < terms.length; j++){
			var subject_area_1 = '';
			var status_1 = '';
			if(data[i]['Subject term'].toLowerCase() == terms[j].Term.toLowerCase()){
				subject_area_1 = terms[j]['Subject area'];	
				status_1 = terms[j]['Status']
				break;
			}
		}
		for(var j = 0; j < terms.length; j++){
			var subject_area_2 = '';
			var status_2 = '';
			if(data[i]['Object term'].toLowerCase() == terms[j].Term.toLowerCase()){
				subject_area_2 = terms[j]['Subject area'];	
				status_2 = terms[j]['Status']
				break;
			}
		}
		// If term is not in unique terms yet and subject area is in list of subject areas in menu
		if(unique_data.indexOf(data[i]['Subject term']) == -1 && allowed_subject_areas.indexOf(subject_area_1) != -1){
			unique_data.push(data[i]['Subject term']);
		}
		if(unique_data.indexOf(data[i]['Object term']) == -1 && allowed_subject_areas.indexOf(subject_area_2) != -1){
			unique_data.push(data[i]['Object term']);
		}		
	}


	// Unique terms:  
	for(var i = 0; i < terms.length; i++){
		if(unique_terms.indexOf(terms[i]['Subject area']) == -1){    
			unique_terms.push(terms[i]['Subject area']);
		}
	}

	// Define links
	var count_bim_links = 0;
	for(var i = 0; i < data.length; i++){		
		if(unique_data.indexOf(data[i]['Object term']) != -1 && unique_data.indexOf(data[i]['Subject term']) != -1){ //object term and subject term are in unique data (nodes) then add links to dataset
			dataset.links.push({'id': i, 'type': data[i].Relationship, 'source_name': data[i]['Object term'], 'source': unique_data.indexOf(data[i]['Object term']), 'target': unique_data.indexOf(data[i]['Subject term']), 'target_name': data[i]['Subject term'],});
			count_bim_links++;
		}
	}

	// Define nodes:
	var count_bim_nodes = 0;
	for(var i = 0; i < unique_data.length; i++){
		for(var j = 0; j < terms.length; j++){
			var subject_area = '';
			var definition = '';
			var phase='';
			var source='';
			var owner='';
			var steward='';
			if(unique_data[i].toLowerCase() == terms[j].Term.toLowerCase()){
				subject_area = terms[j]['Subject area'];
				definition = terms[j]['Definition'];
				status = terms[j]['Status'];
				owner = terms[j]['Owner'];
				steward = terms[j]['Steward'];
				phase = terms[j]['Phase'];
				source = terms[j]['Source'];
				break;
			} 
		}	
		dataset.nodes.push({'id': i, BIM: true, term: unique_data[i], is_leaf: true, is_parent: (unique_data[i] == subject_area), 'subject_area': subject_area, 'definition': definition, 'status': status,'phase':phase, 'source':source,'owner':owner,'steward':steward,'r':rad_std});
		count_bim_nodes++;
	}
	
	// FINREP    
	var finrep_nodes = new Array();
	for(var i = 0; i < finrep_data.length; i++){
		var definition = 'missing definition in finrep terms'; 
		var rowRef = "";
		var colRef ="";
		for(var j = 0; j < finrepterms.length; j++){
			if(finrep_data[i]['Subject Term'].toLowerCase() == finrepterms[j].Term.toLowerCase()){
				definition = finrepterms[j].Definition;
				rowRef = finrepterms[j].row_reference;
				colRef = finrepterms[j].column_reference;
				break;
			}
		}
		if(unique_data.indexOf(finrep_data[i]['Object Term']) != -1){
			//variable to hold id of unique reporting terms
			var finrep_id; 
			if(finrep_nodes.indexOf(finrep_data[i]['Subject Term']) === -1){
				finrep_id = count_bim_nodes + i
				finrep_nodes.push(finrep_data[i]['Subject Term']);
				dataset.nodes.push({'id': finrep_id, 'term': finrep_data[i]['Subject Term'] , BIM: false, is_leaf: true, is_parent: false, subject_area: 'Report FINREP', 'definition': definition, 'report': "FINREP",'rowRef':rowRef,'colRef':colRef,'r':rad_std});
			}
			dataset.links.push({'id': count_bim_links + i, 'type': 'reporting', 'source_name': finrep_data[i]['Object Term'], 'source': unique_data.indexOf(finrep_data[i]['Object Term']), 'target': finrep_id, 'target_name': finrep_data[i]['Subject Term']});
		}	
	}
	
	count_bim_nodes += finrep_data.length;
	count_bim_links += finrep_data.length;	
	
	// AnaCredit    
	var anacredit_nodes = new Array();
	for(var i = 0; i < anacredit_data.length; i++){
		var definition = 'missing definition in AnaCredit terms'; 
		for(var j = 0; j < anacreditterms.length; j++){
			if(anacredit_data[i]['Subject.Term'].toLowerCase() == anacreditterms[j].Term.toLowerCase()){
				definition = anacreditterms[j].Definition;
				break;
			}
		}
		if(unique_data.indexOf(anacredit_data[i]['Object.Term']) != -1){
			//variable to hold id of unique reporting terms
			var anacredit_id;
			if(anacredit_nodes.indexOf(anacredit_data[i]['Subject.Term']) === -1){
				anacredit_id = count_bim_nodes + i;
				anacredit_nodes.push(anacredit_data[i]['Subject.Term']);
				dataset.nodes.push({'id': anacredit_id, 'term': anacredit_data[i]['Subject.Term']  , BIM: false, is_leaf: true, is_parent: false, subject_area: 'Report AnaCredit', 'definition': definition, 'report': "AnaCredit", 'r': rad_std});
			}	
			dataset.links.push({'id': count_bim_links + i, 'type': 'reporting', 'source_name': anacredit_data[i]['Object.Term'], 'source': unique_data.indexOf(anacredit_data[i]['Object.Term']), 'target': anacredit_id, 'target_name': anacredit_data[i]['Subject.Term']});
		}
		
	}

	count_bim_nodes += anacredit_data.length;
	count_bim_links += anacredit_data.length;	

	//COREP
	var corep_nodes = new Array();
	for(var i = 0; i < corep_data.length; i++){
		var definition = 'missing definition in Corep terms'; 
		for(var j = 0; j < corepterms.length; j++){
			if(corep_data[i]['Subject.Term'].toLowerCase() == corepterms[j].Term.toLowerCase()){
				definition = corepterms[j].Definition;
				break;
			}
		}
		if(unique_data.indexOf(corep_data[i]['Object.Term']) != -1){
			//variable to hold id of unique reporting terms
			var corep_id;
			if(corep_nodes.indexOf(corep_data[i]['Subject.Term']) === -1){
				corep_id = count_bim_nodes + i;
				corep_nodes.push(corep_data[i]['Subject.Term']);
				dataset.nodes.push({'id': corep_id, 'term': corep_data[i]['Subject.Term']  , BIM: false, is_leaf: true, is_parent: false, subject_area: 'Report COREP', 'definition': definition, 'report': "COREP", 'r': rad_std});
			}	
			dataset.links.push({'id': count_bim_links + i, 'type': 'reporting', 'source_name': corep_data[i]['Object.Term'], 'source': unique_data.indexOf(corep_data[i]['Object.Term']), 'target': corep_id, 'target_name': corep_data[i]['Subject.Term']});
		}
		
	}

	// Detect leafs
	for(var i = 0; i < dataset.nodes.length; i++){
		var target_count = 0;
		for(var j = 0; j < dataset.links.length; j++){
			if(dataset.links[j].source == i){
				 dataset.nodes[i].is_leaf = false;
				 break;
			}
			if(dataset.links[j].target == i){
				target_count++;
			}
		}
		// If has multiple parent then its not a leaf
		if(target_count > 1){
			 dataset.nodes[i].is_leaf = false;
		}
	}
	
	//Adjust radius attribute of leaf/parent nodes
	for(var i = 0; i < dataset.nodes.length; i++){
		if(dataset.nodes[i].is_leaf == true){
			dataset.nodes[i].r = 5
		}
		if(dataset.nodes[i].is_parent == true){
			dataset.nodes[i].r = 50
		}
	}


	//================================
	// Draw on svg
	//================================	
	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr('id', 'main')
	
	var defs = svg.append("svg:defs");

		
	function marker(color) {
		defs.append("svg:marker")  
            .attr("id", color.replace("#", ""))
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 0)
			.attr("refY", 0)
			.attr("markerWidth", 4)
			.attr("markerHeight", 4)
			.attr("orient", "auto")
			.append("svg:path")
			.attr("d","M0,0 L10,-5 L10,5")
			.style("fill", color);		
		return "url(" + color + ")";
	};
	for(var i =0; i < relations.length; i++){
		marker(c2(relations[i]))
	}
	
	function marker2(color){
		return "url(" + color + ")";
	};
	
	//Create start marker 
	svg.append("svg:defs").selectAll("marker")
		.data(["start"])      
		.enter().append("svg:marker")    
		.attr("id", function(d) { return d; })
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", -1)
		.attr("refY", 0)
		.attr("markerWidth", 4)
		.attr("markerHeight", 4)
		.attr("orient", "auto")
		.attr("fill","gray")
		.append("svg:path")
		.attr("d","M0,0 L10,-5 L10,5");
	
	
	//Create tooltips for links and nodes 	
	var link_tip = d3.tip()
		.attr('class', 'd3-tip linktip')
		.html(function(d) {
			return "<span>" + d.type + "</span>";
		})
		.offset(function() {
		  return [this.getBBox().height / 2 - Math.sqrt(this.getBBox().height), 0 ]
		})
		
	var node_tip = d3.tip()
		.attr('class','d3-tip nodetip')
		.html(function(d){
			return "<span>" + d.subject_area + "</span>";
		})
	
	//tooltip on hovering over circles in dot navigation	
	var navigation_tip = d3.tip()
	.attr('class','d3-tip navtip')	
	.html(function(d,i) {
		switch(i){
			case 0: return "<span>Home page</span>"
			case 1: return "<span>Report templates</span>";
			case 2: return "<span>Reporting repository</span>";
			case 3: return "<span>Conceptual model</span>";
			case 4: return "<span>Logical Data Model</span>";
			case 5: return "<span>Physical Data model</span>";
		}
	})
				
	var tooltip = d3.select("body").append("div")   
		.attr("class", "tooltip")               
		.style("opacity", 0);
	
	//Call the tooltips on the svg
	svg.call(link_tip);	
	svg.call(node_tip);
	svg.call(navigation_tip);
	
	/**
	 * Init starts force simulation
	 * @param {Object} cat  
	 * @param {Boolean} fire_click 
	 * @param {Boolean} node 
	 */
	function init(cat, fire_click, node){

		var fire_click = fire_click || false;
		var node = node || false;
		var filtered = {
			links: new Array(),
			nodes: new Array()
		}

		if(node === true){
			
			filtered.links = dataset.links.filter(function(d, i){
				return false;
			});
			//There might be multiple leaves with same name
			var leaf_catch = [];
			
			filtered.nodes = dataset.nodes.filter(function(d, i) { 	
				if (d.term == cat) {					
					if(d.is_leaf){
						leaf_catch.push(d.id);
					}					
					return true;					
				}else{					
					return false;					
				}
			});
			var parent_nodes = new Array();
			// Also show parent in case of clicking leaf
			if(leaf_catch.length > 0){
				filtered.links = dataset.links.filter(function(d, i) { 
					if(leaf_catch.indexOf(d.target.id) !== -1 ||leaf_catch.indexOf(d.target) !== -1 ){
						if(d.source.id)
							parent_nodes.push(d.source.id);
						else
							parent_nodes.push(d.source)
						return true;
					}else{
						return false;
					}
				});
				filtered.nodes = dataset.nodes.filter(function(d, i) { 	
					return (d.term == cat || parent_nodes.indexOf(d.id) != -1);
				});
				
			}

		}else{
			filtered.links = dataset.links.filter(function(d, i){
				return false;
			});
			filtered.nodes = dataset.nodes.filter(function(d, i) { 
				return (d.is_parent && (d.subject_area == cat || cat == ''))
			});
		
		}

		// create group placeholde for lines
		links_group = svg
			.append('g')
			.attr('class', 'line_group')
			.selectAll('g')			
		
		// draw lines 
		links = links_group
			.data(dataset.links)
			.enter()
			.append("path")
			.attr('class', function(d, i){						
				return  'line e' + i;
			})
			.attr("id",function(d,i) {return 'edge'+i})
			.style('fill', 'none')
			.style('stroke-width', linewidth)
			.style('stroke-dasharray', dasharray)
			.style('cursor','pointer')
			.each(function(d) {
				var color = c2(d.type);
				d3.select(this)
					.style("stroke", line_stroke)
					.attr("marker-start", marker2(color));
			});
		
		//create group for nodes
		nodes_group = svg
			.append('g')
			.attr('class', 'circle_group')
			.selectAll('g')
		//option to select only bim nodes: dataset.nodes.slice(0,bim_only_nodes); expected that only bim nodes are drawn
		//draw nodes 
		nodes = nodes_group
			.data(dataset.nodes) 
			.enter()		
			.append('g')
			.attr('class', function(d, i){	
				if(d.BIM == false){
					return 'no-BIM-node c' + i;
				} else
				return 'node c' + i;
			})
			
			.style('cursor', function(d, i){
				if(!d.is_leaf){
					return 'pointer';
				}else{
					return 'auto';
				}
			})
			.on('click', function(d, i){
				// if(!d.is_leaf){
					update(d, i);
				// }
			})			
			.call(dragfunc)

		d3.selectAll(".node").append("circle")
			.attr('r', radius)
			.attr('fill', node_fill)
			.style('opacity', opacity)
			.style('stroke', node_stroke)
			.style('stroke-width', node_stroke_width);
		
		d3.selectAll(".no-BIM-node").append("rect")	
			.attr("height",10)
			.attr("width",10)
			.attr("x",-5)
			.attr("y",-5)
			.style("fill",node_fill)	
			.style('opacity', opacity)
			.style('stroke', node_stroke)
			.style('stroke-width', node_stroke_width);	

		//write text next to node	
		nodes_txt = nodes_group
			.data(dataset.nodes)
			.enter()	
			.append('text')
			.attr('class', function(d, i){
				if(d.BIM == true){
					return 'BIM node-txt' + i;
				}else{
					return 'no-BIM node-txt' + i;
				}
			})
			.text(function(d, i){
				return d.term;
			})
			.style('cursor','pointer')
			.style("pointer-events", "all")
			.on('contextmenu', d3.contextMenu()) 
			
		//Add tooltips to lines/nodes
		d3.selectAll(".line")
		.on('mouseover',link_tip.show)
		//.on('mousemove',mousemove2)
		.on('mouseout',link_tip.hide);

		d3.selectAll(".node")
			.on('mouseover',node_tip.show)
			.on('mouseout',node_tip.hide);	
		
		d3.selectAll(".no-BIM-node")
			.on('mouseover',node_tip.show)
			.on('mouseout',node_tip.hide);
		//================================
		// Add nodes to force and (re)start
		//================================						
		force.nodes(dataset.nodes)
			.on("tick", ticked);
		
		force.force("link").links(dataset.links);
		
		restart(filtered.nodes, filtered.links, true);
		
		//================================
		// Remove loader and fade svg in
		//================================	
		d3.select('.loader').transition().duration(250).style('opacity', 0).each(function(){
			d3.select(this).remove() 
			d3.select('#main').transition().duration(250).style('opacity', 1);
		});
		if(fire_click == true){
			d3.selectAll(".node").each(function(d, i) {
				//if(d.is_parent){					
					var onClickFunc = d3.select(this).on("click");
					onClickFunc.apply(this, [d, i]);
				//}
			});           
		}		
			
		regenerate_datalist();
		
	}
	
	//================================
	// Update function onclick node
	//================================	
	function update(d, i){

		//clear the existing circles and rectangles before appending new ones
		d3.select('.node circle').remove();
		d3.select('.no-BIM-node rect').remove();  

		active_node = d.term;
		
		var name = d.term;
		var definition = d.definition;

		var str = '<h3>' + name + '</h3>';
			str += '<p>' + definition + '</p>';
			
		d3.select('#expl-text').html(str);
				
		var filtered = {
			links: new Array(),
			nodes: new Array()
		}
		
		// ID of clicked node
		var clicked_node = d.id;
		
		// D3 filter magic (2x)
		var all_nodes = new Array();		
		filtered.links = dataset.links.filter(function(d, i){	
			//type of link is allowed and source and target Subject areas or reports are allowed
			if(selected_relations.indexOf(d.type) !== -1 && 
			(selected_subject_areas.indexOf(d.source.subject_area) !== -1 || selected_reports.indexOf(d.source.subject_area)!== -1) && 
			(selected_subject_areas.indexOf(d.target.subject_area)!== -1) || selected_reports.indexOf(d.target.subject_area)!== -1){ 
			
				if (dataset.links[i].source.id == clicked_node || dataset.links[i].target.id  == clicked_node){	 //clicked node is target or source					
					if(all_nodes.indexOf(dataset.links[i].source.id ) == -1){ //if not yet in all _nodes add node 				
						all_nodes.push(dataset.links[i].source.id );					
					}
					if(all_nodes.indexOf(dataset.links[i].target.id ) == -1){//if not yet in all _links add node 	
						all_nodes.push(dataset.links[i].target.id );
					}						
					return true;					
				}else{					
					return false;					
				}		
			}else{				
				return false;				
			}			
		});		
			
		filtered.nodes = dataset.nodes.filter(function(d, i){			
			if(all_nodes.indexOf(d.id) != -1){				
				return true;				
			}else{				
				return false;				
			}						
		});	

		// restart force
		restart(filtered.nodes, filtered.links);					
	}

	//================================
	// Restart force function
	//================================	
	function restart(new_nodes, new_links) {

		// Apply the general update pattern to the nodes.
		nodes = nodes.data(new_nodes, function(d) { return d.id;});	
		nodes.exit().remove();			
		nodes = nodes
			.enter()
			.append("g")			
			.attr('class', function(d, i){	
				if(d.BIM == false){
					return 'no-BIM-node c' + i;
				} else
				return 'node c' + i;
			})
			.attr('r', radius)
			.style('opacity', opacity)
			.style('stroke-width', node_stroke_width)
			.style('cursor', function(d, i){
				return 'pointer';
				//if(!d.is_leaf){
				//	return 'pointer';
				//}else{
				//	return 'auto';
				//}
			})
			.merge(nodes)
			.attr('fill', function(d, i){			
				if(active_node == d.term){
					return d3.rgb(node_fill(d, i)).brighter(1)
				}else{
					return node_fill(d, i);
				}	
			})
			.style('stroke', function(d, i){				
				if(active_node == d.term){
					return d3.rgb(node_stroke(d, i)).brighter(1)
				}else{
					return node_stroke(d, i);
				}				
			})			
			nodes.on('click', function(d, i){
					update(d,i);
			})	
			.call(dragfunc)
			
		//clear the existing circles and rectangles before appending new ones
		d3.select('.node circle').remove();
		d3.select('.no-BIM-node rect').remove();   

		d3.selectAll(".node").append("circle")
			.attr('r', radius)
			.style('opacity', opacity)
			.style('stroke-width', node_stroke_width);

		d3.selectAll(".no-BIM-node").append("rect")	
			.attr("height",10)
			.attr("width",10)
			.attr("x",-5)
			.attr("y",-5)
			.style('opacity', opacity)
			.style('stroke-width', node_stroke_width);	
		
		
		// Apply the general update pattern to the node txt		
		nodes_txt = nodes_txt.data(new_nodes, function(d) {  return d.id;});	
		nodes_txt.exit().remove();			
		nodes_txt = nodes_txt		
			.enter()
			.append('text')
			.attr('class', function(d, i){
				if(d.BIM){
					return 'node-txt' + i;
				}else{
					return 'no-BIM node-txt' + i;									
				}
			})
			.text(function(d, i){
				return d.term;
			})
			// .(function(d,i){
			// 	return "Right click on nodes to navigate to Logical or Physical Data Model";
			// })
			.style('cursor','pointer')
			.style("pointer-events", "all")
			.on('contextmenu', d3.contextMenu()) 			
			.merge(nodes_txt);
			
		// Apply the general update pattern to the links.
		links = links.data(new_links, function(d) {return d.target.id + "-" + d.source.id; })		
		links.exit().remove();
		links = links
			.enter()
			.append("path")
			.attr('class', function(d, i){
				return  'line e' + i;
			})
			.attr("id",function(d,i) { return 'edge'+i})
			.style('fill', 'none')
			.style("stroke", line_stroke)
			.style('stroke-width', linewidth)
			.style('stroke-dasharray', function(d,i){return dasharray(d,i)})
			.style('cursor','pointer')
			.style("pointer-events", "all")
			.each(function(d) {
				var color = c2(d.type);
				d3.select(this)
					.style("stroke", line_stroke)
					.attr("marker-start", marker2(color));
			})
			.merge(links);
			

			//Add tooltips to lines
			d3.selectAll(".line")
				.on('mouseover',link_tip.show)
				.on('mouseout',link_tip.hide);
				
		

			//Add tooltips for nodes 
			d3.selectAll(".node")
				.on('mouseover',node_tip.show)
				.on('mouseout',node_tip.hide);	
				
			//Add tooltips for reporting nodes
			d3.selectAll(".no-BIM-node")
				.on('mouseover',node_tip.show)
				.on('mouseout',node_tip.hide);
				

		var force = d3.forceSimulation(nodes)
			.force("charge", d3.forceManyBody().strength(f.chargeStrength))
			.force("center", d3.forceCenter(1.3 * width / 2, height / 2)) 
			.force("link", forceLink)
			.force("y", d3.forceY(0))
			.force("x", d3.forceX(0))
			
		force.alphaTarget(0).alpha(0);
		
	}	

	/**
	 * Clears the svg and initialise force
	 */
	function clear_svg(){
		svg.selectAll("g").remove();
		width = window.innerWidth - 50;
		height = window.innerHeight * 1;

		svg.attr("width", width)
		svg.attr("height", height)
		
		force.stop();
		force = d3.forceSimulation()
			.force("charge", d3.forceManyBody().strength(f.chargeStrength))
			.force("center", d3.forceCenter(1.3 * width / 2, height / 2)) 
			.force("link", forceLink)
			.force("y", d3.forceY(0))
			.force("x", d3.forceX(0))
	}	

	/**
	 * Make autocomplete list on click of checkbox in legend
	 */
	function regenerate_datalist(){
			d3.select('datalist').selectAll('*').remove();
			d3.select('datalist').selectAll('option')
				.data(dataset.nodes.filter(function(d, i){
				return ((selected_subject_areas.indexOf(d.subject_area) !== -1) || (selected_reports.indexOf(d.subject_area) !== -1));
			}))
			.enter()
			.append('option')
			.html(function(d, i){
				return d.term;
			})
			.attr('class', function(d, i){
				if(d.is_leaf){
					return 'leaf';
				}else{
					return '';
				}
			})
			if(compl){
				compl.destroy();
			}
			compl = new Awesomplete(document.getElementById("search"), 		
				{
					list: "#options",
					minChars: 3,
					maxItems: 40,
					autoFirst: true,
					filter: function(text,input){
						if (fuzzysort.single(input, text.label) != null){
							if(fuzzysort.single(input, text.label).score > -100000){ // change threshold to adjust which terms are shown
								return true
							}
							else{
								return false 
							}
						} else {
							return false 
						}
					}
				});			
		}

	function selectAll(){
		d3.select(this.parentNode.parentNode).selectAll('input[type="checkbox"]').property('checked',true);
		selected_relations = get_relations();
		selected_subject_areas = get_nodes();
		selected_reports = get_reports();
		clear_svg();
		if(typeof active_node == 'undefined'){
			init('');
		}else{
			init(active_node, true, true);
		}
	}

	function deSelectAll(){
		d3.select(this.parentNode.parentNode).selectAll('input[type="checkbox"]').property('checked',false);
		selected_relations = get_relations();
		selected_subject_areas = get_nodes();
		selected_reports = get_reports();
		clear_svg();
		if(typeof active_node == 'undefined'){
			init('');
		}else{
			init(active_node, true, true);
		}
	}

	//function to show terms of selected tab
	function show_terms(sel_tab,i){
		selected_tab = sel_tab;
		var alphabets = [];
		var styledAlphabet = [];
		d3.selectAll('#dictionary-inner #content_tab li').remove();
		d3.selectAll('#dictionary-inner ul li a').classed('active',false)	
		d3.selectAll('#dictionary-inner ul li a').each(function(d){
			if(d === sel_tab ){
				d3.select(this).classed('active',true) }
		})
		//set scroll to be at the top initially when tab is selected
		document.getElementById('content_tab').scrollTop = 0;

		terms = d3.selectAll('#dictionary-inner #content_tab').selectAll('li')
				.data(dataset.nodes.filter(function(d, i){
					//check if terms subject area or term itself(search button) is selected
					return (d.subject_area == sel_tab || d.term == sel_tab)
				}).sort(function(a, b) {
					//Push first letter of terms to alphabets
					alphabets.push(a.term[0])
					if (a.term > b.term) {
						return 1;
					}
					if (a.term < b.term) {
						return -1;
					}
						return 0;
					})
				)
				.enter()
				.append('li')
				.html(function(d, i){
					var str;
					//conditionally style first letter of terms
					if(styledAlphabet.indexOf(d.term[0]) === -1){
						styledAlphabet.push(d.term[0]);	
						str = '<h4 class="first_letter">' + d.term + '<span class="glyphicon glyphicon-info-sign"></span></h4>';
					}
					else{
						str = '<h4>' + d.term + '<span class="glyphicon glyphicon-info-sign"></span></h4>';
					}
					return str;	
				})
		terms.select('h4').on('click',function(d,i){
				d3.event.stopPropagation();
				//hide the toolip in dictionary, if any
				tooltip.transition().duration(100).style("opacity",0); 						
				d3.select('#dictionary').transition().duration(1000).style('right', -d3.select('#dictionary').node().getBoundingClientRect().width + 'px');							
				clear_svg();
				//Fire click is true to show all childNodes for nodes which are not leaf
				if(!d.is_leaf)
					init(d.term,true,true)
				else
					init(d.term, false, true);
				alertify.success('Term <strong>' + d.term + '</strong> loaded.')
		})	

		terms.select('h4 span').on('click',function(d){
			d3.event.stopPropagation();
			d3.selectAll('#dictionary-inner #content_tab li h4').style('opacity',0.2);
			d3.select(this.parentNode).style('opacity',1);
			tooltip.transition().duration(200).style("opacity", 1);    
			tooltip.html(d.definition + '<br><p class="definition_tip">Status :  <b>' + d.status +'</b></p>'+
			'<p class="definition_tip">Phase :  <b>' + d.phase +'</b></p>'+
			'<p class="definition_tip">Source :  <b>' + d.source +'</b></p>'+
			'<p class="definition_tip">Owner :  <b>' + d.owner +'</b></p>'+
			'<p class="definition_tip">Steward :  <b>' + d.steward +'</b></p>')
				.style("left", function(){ 

					if(d3.event.pageX > 1200)	{
						if(d3.event.pageX > 1600)
							tooltip.style('width','150px')
						else
							tooltip.style('width','250px')
						tooltip.style('text-align','left')
						return (d3.event.pageX + 50 ) + "px";
					}
					else{
						tooltip.style('width','500px')
						tooltip.style('text-align','center')								
						return (d3.event.pageX + 100) + "px";
					}
				})     
				.style("top",function(){
					if(d3.event.pageY > 900){ return  (d3.event.pageY - 80) + "px";}
					else{ return  (d3.event.pageY - 40) + "px"; }
				})
		})	

		d3.selectAll('#dictionary-inner #content_tab #alp').selectAll('li')
		.data(Array.from(new Set(alphabets)).sort())//set retains only unique elements in array
		.enter()
		.append('li')
		.html(function(d){return '<a href="#">'+d+'</a>';})
		.on('click',scrollToAlphabet)
		
		//create newlist based on tab Selection
		var newList = [] ;
		terms.each(function(d,i){ newList.push(d);})

		d3.select('#dict-list').selectAll("*").remove();
		d3.select('#dict-list').selectAll('option')
		.data(newList)
		.enter()
		.append('option')
		.html(function(d){return d.term})

		//If auto completion object exists, clear before craeting new one
		if(dict_autocompl){
			dict_autocompl.destroy();
		}
		//create auto completion object for dictionary based to tab selected
		dict_autocompl = new Awesomplete(document.getElementById('dictionarySearch'),
		{
			list:"#dict-list",
			minChars :1,
			maxItems:40,
			autoFirst:true,
			filter: function(text,input){
				if (fuzzysort.single(input, text.label) != null){
					if(fuzzysort.single(input, text.label).score > -100000){ // change threshold to adjust which terms are shown
						return true
					}
					else{
						return false 
					}
				} else {
					return false 
				}
			}
		})					
	}	

	/**
	 * Function scrolls the view to terms starting with alphabet which is calling parameter
	 * @param {*char} d 
	 */
	function scrollToAlphabet(d,i){
		var displayedTerms = d3.selectAll('#dictionary-inner #content_tab li h4')._groups[0];
		for(var index=0; index < displayedTerms.length; index++){
			 if(displayedTerms[index].innerText.startsWith(d)){
				var element = document.getElementById('content_tab');
				element.scrollTop = index *(element.scrollHeight/displayedTerms.length);
				//element.scrollTop = ((index - i) *((element.scrollHeight-360)/(displayedTerms.length-firstLetterTerms.length))) + ( i* (360/firstLetterTerms.length)) ;
				return;
			 }
		}	 
	}

	/**
	 * Make legend lines  in visualisation
	 */
	d3.select('#legend-lines ul.relation-list')
		.selectAll('li')
		.data(relations)
		.enter()
		.append('li')
		.html(function(d, i){			
			var str =  '<div class="md-checkbox">';
				str += '<input type="checkbox" id="checkbox' + i + '" value="' + d + '" checked><label for="checkbox' + i + '"><span>' + d + '</span></label>';
				str += '</div>';
			var a = {
				'type': d
			}			
			str += ' <svg class="small2"><path stroke="' + line_stroke(a, i) + '" stroke-width="' + linewidth(a, i) + '" style="stroke-dasharray: ' + dasharray(a, i) + '" d="M5 20 l215 0" /></svg>';
			return str;
		})
		
	d3.selectAll('#legend-lines input').on('click', function(d, i){
		selected_relations = get_relations();
		clear_svg();
		init(active_node, true, true);
		
	});	
		
	/**
	 * Make legend Nodes in visualisation
	 */
	var legend_items = d3.select('#legend ul').selectAll('li')
						.data(allowed_subject_areas)
						.enter()
						.append('li')
		
	legend_items.append('input')
				.attr('type', 'checkbox')
				.attr('id', function(d, i){
					return 'checkbox-circles' + i;
				})
				.property('checked', true)
				.attr('value', function(d, i){
					return d;
				})
				.on('click', function(d, i){		
					selected_subject_areas = get_nodes();
					clear_svg();
					init(active_node, true, true);
				});
	
	legend_items.append('span')
				.attr('class', 'label')
				.text(function(d, i){
					return d;
				})
				.on('click', function(d, i){
					clear_svg();
					init(d, true, false);
					alertify.success('Parent <strong>' + d + '</strong> loaded.');
				});	
		
	//draw circles
	legend_items.append('svg')
				.attr('class', 'small')
				.append('circle')
				.attr('r', 10)
				.attr('cx', 188)
				.attr('cy', 12)
				.attr('fill', function(d, i){
					var a = {
						'subject_area': d
					}
					return node_fill(a, i);
				})
				.attr('stroke', function(d, i){
					var a = {
						'subject_area': d
					}
					return node_stroke(a, i)	;		
				})
				.attr('stroke-width', function(d, i){
					var a = {
						'subject_area': d
					}
					return node_stroke_width(a, i);				
				});

	/**
	 * Make legend for reports in visualisation
	 */
	var legend_reports = d3.selectAll("#legend-reports ul").selectAll('li')
						.data(reports)
						.enter()
						.append('li');

	legend_reports.append('input')
				.attr('type', 'checkbox')
				.attr('id', function(d, i){
						return 'checkbox-circles' + i;
				 })
				.property('checked', true)
				.attr('value', function(d, i){
						return d;
				})
				.on('click', function(d, i){		
					selected_reports = get_reports();
					clear_svg();
					init(active_node, true, true);			
				});					
	
	legend_reports.append('span')
				.attr('class', 'label')
				.text(function(d, i){
					return d;
				})
				.on('click', function(d, i){
					clear_svg();
					//open dictionary and show the Report terms which is clicked
					d3.select('#dictionary').transition().duration(1000).style('right', '50px');
					//simulate on click of show_reports button only if it is not already shown
					if(!show_reports)
						d3.select('#dictionary-inner #show_reports').on("click").apply(this,[d])
					//simulate on click of particular report nav tab
					d3.select('#dictionary-inner #report-tab li a').on("click").apply(this, [d]);
				});	

	//draw square in legend
	legend_reports.append('svg')
				.attr('class', 'small')
				.append('rect')
				.attr('height', 15)
				.attr('width', 15)			
				.attr('x', 178)
				.attr('y', 12)
				.attr('fill', function(d, i){
					var a = {
						'subject_area': d
					}
					return node_fill(a, i);
				})
				.attr('stroke', function(d, i){
					var a = {
						'subject_area': d
					}
					return node_stroke(a, i);		
				})
				.attr('stroke-width', function(d, i){
					var a = {
						'subject_area': d
					}
					return node_stroke_width(a, i);				
				});
	
	// Open dictionairy
	d3.select('a#dictionary-open').on('click', function(d, i){
			d3.select('#dictionary').transition().duration(1000).style('right', '50px');
	});
	// Close dictionairy
	d3.select('#dictionary-close a').on('click', function(d, i){
			//hide the tooltips in dictionary, if any
			tooltip.transition().duration(200).style("opacity", 0);  
			//change opacity back to original
			d3.selectAll('#dictionary-inner #content_tab li h4').style('opacity',1);			
			d3.select('#dictionary').transition().duration(1000).style('right', -d3.select('#dictionary').node().getBoundingClientRect().width + 'px');
		});

	var hrefs = ['index.html','tableLayoutFINREP.html','conceptualModel.html?dict=reports','conceptualModel.html','arrangement_ldm.html','arrangement_pdm.html']
	var dotContainer = d3.select(".dot-container").selectAll('a')
						.data(hrefs) 
						.enter()	
						.append('a')
						.html(function(d, i){
							//Highlight conceptual model icon when it is loaded
							if(i==2){
								d3.select(this).classed('active',true);
							}
							switch(i){
								case 0: return '<span class="glyphicon glyphicon-home"></span>';									
								case 1:	return '<span class="glyphicon glyphicon-duplicate"></span>';
								case 2:	return '<span class="glyphicon glyphicon-list-alt"></span>';
								case 3:	return '<span class="glyphicon glyphicon-dashboard"></span>';
								case 4:	return '<span class="glyphicon glyphicon-modal-window"></span>';
								case 5:	return '<span class="glyphicon glyphicon-hdd"></span>';										
							}
						})
						.on('click',function(d,i){
							d3.select(this).attr("href",d);			
						})
						.on('mouseover',navigation_tip.show)
						.on('mouseout',navigation_tip.hide);

	d3.select('#dictionary-inner').on('click',function(d){
		//remove tooltip on click anywhere in li
		tooltip.transition().duration(100).style("opacity",0); 
		//change opacity of div back to original
		d3.selectAll('#dictionary-inner #content_tab li h4').style('opacity',1);
	})
 
	d3.selectAll('#legend-reports a.select-all').on('click',selectAll);
	d3.selectAll('#legend-reports a.deselect-all').on('click',deSelectAll);

	d3.selectAll('#legend a.select-all').on('click',selectAll);
	d3.selectAll('#legend a.deselect-all').on('click',deSelectAll);

	d3.selectAll('#legend-lines a.select-all').on('click', selectAll);
	d3.selectAll('#legend-lines a.deselect-all').on('click', deSelectAll);
		
	//listen to event of show subareas button
	d3.select('#dictionary-inner #show_sub_areas').on('click',function()
	{			
		show_sub_areas = !show_sub_areas;
		if (!show_sub_areas){
			d3.select('#subject-tab').style('height', 0).style('overflow', 'hidden');
			d3.select('#sub-tab').style('opacity',0)
			//clear li only if selected tab is one of subject areas
			if(allowed_subject_areas.indexOf(selected_tab)!== -1)
				d3.selectAll('#dictionary-inner #content_tab li').remove();	
		}					
		else{
			d3.select('#subject-tab').style('height','auto').style('overflow',null);
			d3.select('#sub-tab').style('opacity',1)
			
		}	
		//placeholders for tabs per subject area
		var dictionary_tabs = d3.select('#subject-tab').selectAll('li')
		.data(allowed_subject_areas.sort())
		.enter()
		.append('li').append('a')
		.on('click',show_terms)
		.append('h2')
		.text(function(d,i){
			return d;
		})
	})

	//listen to event of show reports button
	d3.select('#dictionary-inner #show_reports').on('click',function()
	{			
		show_reports = !show_reports;	
		if (!show_reports){
			d3.select('#report-tab').style('height', 0).style('overflow', 'hidden');
			d3.select('#rep-tab').style('opacity',0)
			//clear li only if selected tab is one of reports
			if(reports.indexOf(selected_tab)!==-1)
				d3.selectAll('#dictionary-inner #content_tab li').remove();					
		}	
		else{
			d3.select('#report-tab').style('height','auto').style('overflow',null);
			d3.select('#rep-tab').style('opacity',1)
			
		}	
		var report_tabs= d3.select('#report-tab').selectAll('li')
		.data(reports.sort())
		.enter()
		.append('li').append('a')
		.on('click',show_terms)
		.append('h2').text(function(d,i){
			return d;
		})

	})
	
	var hrefs = ['index.html','tableLayoutFINREP.html','conceptualModel.html?dict=reports','conceptualModel.html','arrangement_ldm.html','arrangement_pdm.html']
	var dotContainer = d3.select(".dot-container-concep").selectAll('a')
						.data(hrefs) 
						.enter()	
						.append('a')
						.html(function(d, i){
							//Highlight dictionary icon when it is loaded
							if(i==3){
								d3.select(this).classed('active',true);
							}
							switch(i){
								case 0: return '<span class="glyphicon glyphicon-home"></span>';								
								case 1:	return '<span class="glyphicon glyphicon-duplicate"></span>';
								case 2:	return '<span class="glyphicon glyphicon-list-alt"></span>';
								case 3:	return '<span class="glyphicon glyphicon-dashboard"></span>';
								case 4:	return '<span class="glyphicon glyphicon-modal-window"></span>';
								case 5:	return '<span class="glyphicon glyphicon-hdd"></span>';												
							}
						})
						.on('click',function(d,i){
							d3.select(this).attr("href",d);			
						})
						.on('mouseover',navigation_tip.show)
						.on('mouseout',navigation_tip.hide);
	
	document.getElementById('dictionarySearch').addEventListener("keyup",function(event){
		event.preventDefault();
		if(event.keyCode == 13){
			if(unique_data.indexOf(this.value) != -1 ||finrep_nodes.indexOf(this.value) != -1 ||anacredit_nodes.indexOf(this.value) != -1 || corep_nodes.indexOf(this.value)!= -1){
				//remove tooltip on clicking on search
				tooltip.transition().duration(100).style("opacity",0); 
				//change opacity of div back to original
				d3.selectAll('#dictionary-inner #content_tab li h4').style('opacity',1);
				show_terms(this.value);			
			}else{
				alert("could not show")
			}
		}
		
	})

	//re-loads svg when term is typed in searchbar and pressed enter
	document.getElementById("search").addEventListener("keyup", function(event) {		
		event.preventDefault();
		if (event.keyCode == 13) {	
			if(unique_data.indexOf(this.value) != -1 || finrep_nodes.indexOf(this.value) != -1 || anacredit_nodes.indexOf(this.value) != -1 || corep_nodes.indexOf(this.value) != -1){ //need an all_nodes object to check whether node exist
				clear_svg();
				init(this.value, true, true);
				alertify.success('Term <strong>' + this.value + '</strong> loaded.');				
			}else{
				alertify.error("Term not found in dictionary.");
				
			}
		}
	});	
	
	/* Check if query parameter has a value, then load the term in visualization 
	** otherwise initialise with empty parameters
	*/
	var queryString = location.search.replace('?','');
	if (queryString.length != 0){
		//Use of Regex expression to get word after '=' in query parameter
		var input = decodeURI(queryString.match('\\=(\\S+)')[1]).split(",");
		var rep_term = input[0]
		var fire_click = Boolean(input[1])
		if(rep_term === 'reports'){
			//open dictionary and simulate shwo_reports click
			d3.select('#dictionary').transition().duration(1000).style('right', '50px');
			d3.select('#dictionary-inner #show_reports').on('click').apply(this,[]);
		}
		else if(unique_data.indexOf(rep_term) != -1 || finrep_nodes.indexOf(rep_term) != -1 || anacredit_nodes.indexOf(rep_term) != -1 ){ //need an all_nodes object to check whether node exist
			clear_svg();
			if(fire_click === false){
				init(rep_term, false, true);
			}else{
				init(rep_term, true, true);
			}
		}else{
			alertify.error(rep_term +"  not found in Conceptual Model.");
			init('');					
		}
	}else{
		init('');		
	}
	
}