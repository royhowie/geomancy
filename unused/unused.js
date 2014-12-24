var getNumber = function () {
	var binary = [roll(), roll(), roll()].map(function (item) {
			return (item.toString(2).length == 1 ? "0" : "") + item.toString(2);
		}).join("");
	return parseInt((roll() > 1 ? "1" : "0") + binary, 2);
}