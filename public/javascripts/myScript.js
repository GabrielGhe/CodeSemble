//http://cdnjs.com/libraries/codemirror
var fayeClient;
var myCodeMirror;
var editor;

$(document).ready(function(){

	//settings up faye
	fayeClient = new Faye.Client('http://localhost:3000/faye', {
		timeout : 120
	});

	//setting up CodeMirror
	editor = document.getElementById("editor");
	myCodeMirror = CodeMirror(editor, {
		value: "\n\n\n",
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript",
		theme: "monokai"
	});
});