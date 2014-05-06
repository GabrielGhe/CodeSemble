var myCodeMirror;

$(document).ready(function(){

	//setting up CodeMirror
	myCodeMirror = CodeMirror(document.getElementById("editor"), {
		value: "\n\n\n",
		lineNumbers: true,
		matchBrackets: true,
		mode:  "javascript",
		theme: "monokai"
	});
});