// geomancy.js
var roll = function () { return (Math.random() * 4) | 0 }
var meld = function (a, b) {
	return a.map(function (d, i) {
		return (a[i] + b[i]) % 2;
	})
}
var getCircles = function (n) {
	return (n == 2 ? "<div class='circle'></div>" : "") + "<div class='circle'></div>";
}

var patterns = function (dots) {
	// dots = Array.apply(null, new Array(16)).map(function () { return Math.random() < 0.5 ? 0 : 1});
	var mothers = [], daughters = [], nephews = [], witnesses = [];

	// generate the mothers and daughters
	for (var i = 0; i < 4; i++) {
		mothers[3 - i] = dots.slice(i << 2, 4 + (i << 2));
		daughters[3 - i] = (function () {
			var t = [];
			for (var j = 0; j < 4; j++) {
				t.push(dots[i + (j << 2)]);
			}
			return t;
		})();
	}

	// generate the nephews
	for (var i = 0; i < 2; i++) {
		nephews[i] = meld(mothers[3 - (i << 1)], mothers[2 - (i << 1)]);
		nephews[i + 2] = meld(daughters[3 - (i << 1)], daughters[2 - (i << 1)]);
	}

	witnesses = [ meld(nephews[0], nephews[1]), meld(nephews[2], nephews[3]) ];

	return witnesses.concat([ meld(witnesses[0], witnesses[1]) ]);
}

var r = [];
var rollFaces = function () {
	var shiftFace = function (n, face, time) {
		face = (1 + face) % 4;
		$("#die" + n).attr("src", "diefaces/die" + (face + 1) + ".png");
		if (time < 300 + 125 * Math.random()) {
			setTimeout(function () {
				shiftFace(n, face, time * 1.1);
			}, time);
		} else {
			r[n - 1] = face + 1;
		}
	}
	for (var i = 1; i < 5; i++) {
		r[i - 1] = false;
		shiftFace(i, i, 50);
	}
}

var appendResults = function (arr) {
	$("#results").append(
		'<div class="roll-result">' +
			'<img src="diefaces/die' + arr[0] + '.png">' +
			'<img src="diefaces/die' + arr[1] + '.png">' +
			'<img src="diefaces/die' + arr[2] + '.png">' +
			'<img src="diefaces/die' + arr[3] + '.png">' +
		'</div>'
	)
}

var generatePattern = function (arr) {
	console.log("generating the pattern...")
	arr = patterns(arr).map(function (row) { return row.map(function (item) { return 2 - item }) })

	console.log(arr);
	for (var i = 0; i < arr.length; i++) {
		var s = "<div class='sub-pattern'>";
		for (var j = 0; j < arr[i].length; j++) {
			s += "<div class='row'>";
			s += getCircles(arr[i][j]);
			s += "</div>";
		}
		$("#pattern").append(s + "</div>");
	}
	$("#fortune-box p").text("your fortune would be here");
}

var k = 0, total = [];
var process = function () {
	$("#times").text(4 - ++k);
	if (k < 5) {
		$("#roll").attr("disabled", true);
		rollFaces();

		var l = setInterval(function () {
			if (r.reduce(function (p, c) { return p && c })) {
				$("#roll").attr("disabled", false);
				total = total.concat(r);
				appendResults(r);
				
				clearInterval(l);
				if (k == 4) {
					$("#times").parent().parent().remove();
					$("#roll").attr("disabled", true);
					total = total.map(function (d) {
						return d % 2;
					})
					generatePattern(total);
				}
				console.log(total);
				console.log("k is", k);
			}
		}, 250)
	}
}
$(document).ready(function () {
	$("#question").change(function () {
		var v = parseInt($(this).val());
		// should reset everything, if a new question is selected
		if (v != -1) {
			$("#geomancer-wrapper, #results").css("display", "inline-block");
		} else {
			window.location.reload();
		}
		k = 0; total = []; r = [];
		$("#results").empty();
		$("#times").text(4);
	});

	$("#roll").click(process);
})