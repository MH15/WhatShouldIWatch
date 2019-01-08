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


function ToggleAboutMenu() {
	if (dom.CLOSE_ABOUT.style.opacity == 0) {
		dom.CLOSE_ABOUT.style.display = "flex"
		dom.ABOUT.style.display = "flex"
		// dom.CLOSE_ABOUT.style.opacity = 1
		// dom.ABOUT.style.opacity = 1

		setTimeout(() => {
			dom.CLOSE_ABOUT.style.opacity = 1
			dom.ABOUT.style.opacity = 1
		}, 10)
	} else {
		dom.CLOSE_ABOUT.style.opacity = 0
		dom.ABOUT.style.opacity = 0
		setTimeout(() => {
			dom.CLOSE_ABOUT.style.display = "none"
			dom.ABOUT.style.display = "none"
		}, 300)
	}

}


let cards_dom = document.querySelectorAll('.card')

let cards = []

cards_dom.forEach(card => {
	let name = card.getAttribute('film-title')
	card.querySelector('.top').addEventListener('click', () => {
		expandCard(card)
	})
	cards.push({
		dom: card,
		title: name
	})
})



let card_expanded = false

function expandCard(card) {
	if (card.classList.contains('expanded')) {
		card.removeAttribute('style')
	}
	card.classList.toggle('expanded')
	card.querySelector('.card-control').classList.toggle('expanded')

	if (card.classList.contains('expanded')) {
		console.log("sts")
		setTimeout(() => {
			console.log("adjusting max-height to " + card.offsetHeight + "px")
			let compStyles = window.getComputedStyle(card)
			console.log("current max-height is " + compStyles.getPropertyValue('max-height'))

			card.style.maxHeight = card.offsetHeight + "px"

			let compStyles2 = window.getComputedStyle(card)
			console.log("updated max-height is " + card.style.maxHeight)
		}, 500)

	} 
}