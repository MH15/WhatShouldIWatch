//
// Control popups and about menu
// 
// try to minimize the number of server requests
//



let dom = {}

// add all elements in array to dom object
let els = [
	{
		id: "OPEN_ABOUT",
		event: 'click',
		callback: ToggleAboutMenu
	},
	{
		id: "CLOSE_ABOUT",
		event: 'click',
		callback: ToggleAboutMenu
	},
	{
		id: "ABOUT"
	}
]
els.forEach(el => {
	dom[el.id] = document.querySelector(`#${el.id}`)
	if (el.event) {
		dom[el.id].addEventListener(el.event, el.callback)

	}
})

dom.ABOUT.enabled = true

console.log(dom)

function ToggleAboutMenu() {
	console.log("yeet")
	// when press, close menu
	dom.CLOSE_ABOUT.classList.toggle("disabled")
	dom.ABOUT.classList.toggle("disabled")

}