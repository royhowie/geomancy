let Promise = require('bluebird')
const DOMAIN = 'IMG_DOMAIN_HERE'

function GET (url) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest()

        xhr.open('GET', url, true)

        xhr.onload = function () {
            resolve(xhr.response)
            /*
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr.response)
                } else {
                    reject({ status: this.status, message: xhr.statusText })
                }
            */
        }

        xhr.onerror = function () {
            reject({ status: this.status, message: xhr.statusText })
        }

        xhr.send()
    })
}

Array.prototype.chunk = function (chunkSize) {
    return this.reduce((chunk, nextElement) => {
        if (chunk[chunk.length - 1].length < chunkSize) {
            chunk[chunk.length - 1].push(nextElement)
        } else {
            chunk.push([nextElement])
        }
        return chunk
    }, [[]])
}

function $ (q) {
    return document.querySelector(q)
}

/*
    generates HTML for the circles
    if `n == 2`, return 2 circles; otherwise, return a single circle
*/
function getCircles (n) {
    if (n == 2)
        return `<div class="circle"></div><div class="circle"></div>`
    return '<div class="circle"></div>'
}

function step (fn, time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(fn()), time)
    })
}


class Die {
    constructor (startFace, target) {
        this.face = startFace
        this.target = target
        this.maxRollTime = 250 * (1 + Math.random())
    }

    getLink () {
        return `./images/die${ this.face + 1 }.png`
    }

    getValue () {
        return this.face
    }

    inc () {
        this.face = (this.face + 1) % 4
    }

    roll () {
        return this.shiftFace(50)
    }

    shiftFace (time) {
        this.inc()
        this.update()

        if (time < this.maxRollTime) {
            return step(() => this.shiftFace(time * 1.1), time)
        }

        return Promise.resolve(this.getValue())
    }

    update () {
        this.target.setAttribute('src', this.getLink())
    }
}

class PatternTable {
    constructor (data) {
        this.data = data
        this.table = {}
        this.constructTable()
    }

    constructTable () {
        this.data.split(/#.+\n/g)
            .slice(1)
            .map(page => page.split('\n').map(row => row.replace(/[^\d]/g,'')))
            .forEach((halfPage, pageNumber) => {
                let page = Math.floor(pageNumber / 2)
                let side = pageNumber % 2 === 0

                halfPage.forEach((row, index) => {
                    this.table[row] = [ page, side, index ]
                })
            })
        delete this.table['']
    }
    /*
        a table entry is [ page, side, index ]
        page is just the page number, starting from 0
        side is a boolean; true for left, false for r
        index is the picture number on the page
    */
    lookup (code) {
        let entry = this.table[code]
        if (!entry) {
            return ''
        } else {
            return `p${ entry[0] }_${ entry[1] ? 'L' : 'R' }_${ entry[2] }`
        }
    }
}

class Geomancer {
    /*
        results         : after each set of four rolls, display results here
        rollCounter     : node displaying the number of rolls left to the user
        patternHolder   : where the final pattern from `generatePattern` is held
    */
    constructor (results, rollCounter, patternHolder, lookupTable) {
        this.rolls = []
        this.rollsLeft = 4

        this.appendTo = results
        this.rollCounter = rollCounter
        this.patternHolder = patternHolder
        this.lookupTable = lookupTable

        this.dice = []
        for (let i = 1; i < 5; i++) {
            this.dice[i - 1] = new Die(i, $('#die' + i))
        }
    }

    getFortuneLink (res) {
        let path = res.map(pattern => pattern.join('')).join('')
        let paddedQuestionNumber = this.question < 10 ?
            '0' + this.question : String(this.question)

        return `${ paddedQuestionNumber }_${ this.lookupTable.lookup(path) }.jpg`
    }
    /*
        good guide on how the patterns are generated:
            http://sarahgoslee.com/as/geomancy/
    */
    getPatterns () {
        // convert our rolls to mod 2
        let dots = this.rolls.map(d => d % 2)

        // helper function for adding two arrays mod 2
        let meld = (a, b) => a.map((_, i) => (a[i] + b[i]) % 2)

        /*
            Given 16 starting elements (`dots`), the mothers are generated by taking
            one element at a time and placing it into one of four possible groups.

            The first element is placed in the top right corner. The second element
            below the first. The fifth element begins the top of the second symbol,
            and so on.

            This process it the same as chunking the array into groups of 4, then
            reversing the chunks
        */
        let mothers = dots.chunk(4).reverse()
        /*
            From the pattern generated by the creation of the mothers, the daughters
            consist of the "rows". The first row is the first daughter, the second
            the second, and so on.

            In other words, daughters[0] is indices { 0, 4, 8, 12 }
                            daughters[1] is indices { 1, 5, 9, 13 }

            Algorithm: pluck elements from the array based on the index mod 4. Then,
            of course, since the geomancer is RTL, reverse the daughters.
        */
        let daughters = Array.from(Array(4), (_, n) => {
            return dots.filter((_, i) => (i % 4) == n)
        }).reverse()

        /*
            The nephews then consist of pairs of mothers or daughters "melded"
            together mod 2.
            nephews[0] = meld(mothers[0], mothers[1])
            nephews[1] = meld(mothers[2], mothers[3])
            nephews[2] = meld(daughters[0], daughters[1])
            nephews[3] = meld(daughters[2], daughters[3])

            Again, since the geomancer is RTL, reverse the nephews.
        */
        let nephews = [
            meld(mothers[0], mothers[1]),
            meld(mothers[2], mothers[3]),
            meld(daughters[0], daughters[1]),
            meld(daughters[2], daughters[3])
        ].reverse()

        /*
            The witnesses consist of each pair of nephews melded together.
            Since the nephews have already been reversed, no need to reverse the
            witnesses.
        */
        let witnesses = [meld(nephews[0], nephews[1]), meld(nephews[2], nephews[3])]

        /*
            The last figure, the judge, consists of the 2 witnesses melded together.
        */
        let judge = meld(witnesses[0], witnesses[1])

        /*
            The generated pattern is then the two witnesses and the judge.
            We have used 0 to represent "even" and 1 "odd". However, we want
            "2" to represent even and 1 "odd", so map the elements:
        */
        return witnesses.concat([judge]).map(row => row.map(item => 2 - item))
    }

    generatePattern () {
        let result = this.getPatterns()

        $('#pattern').innerHTML = result.map((row) => {
            return (
                '<div class="sub-pattern">'
                + row.map(item => `<div class='row'>${ getCircles(item) }</div>`).join('')
                + '</div>'
            )
        }).join('')
        // console.log('result is', result, this.getFortuneLink(result))
        $('#fortune-box').innerHTML = `<img src='${ DOMAIN }/${ this.getFortuneLink(result) }'>`
    }

    reset () {
        this.rolls = []
        this.rollsLeft = 4
        this.appendTo.innerHTML = ''
        this.update()

        $('#roll').removeAttribute('disabled')
    }

    roll () {
        if (this.rollsLeft < 1) {
            return;
        }

        return Promise.all(this.dice.map(die => die.roll())).then((dice) => {
            this.rollsLeft -= 1
            this.rolls = this.rolls.concat(dice.map(die => die + 1))
            this.update()

            if (this.rollsLeft < 1) {
                $('#roll').setAttribute('disabled', true)
                this.generatePattern()
            }
        })
    }

    setQuestion (num) {
        this.question = num
    }

    update () {
        this.rollCounter.innerHTML = this.rollsLeft

        let len = this.rolls.length

        if (len === 0)
            return

        let toAppend = '</div>'
        for (let i = len - 1; i >= Math.max(0, len - 4); i--) {
            toAppend = `<img src='./images/die${ this.rolls[i] }.png'>` + toAppend
        }
        toAppend = '<div class="roll-result">' + toAppend

        this.appendTo.innerHTML += toAppend
    }
}


function addQuestions (questions) {
    let target = $('#question')
    questions.split('\n').slice(0, 25).forEach((question, index) => {
        let option = document.createElement('option')
        option.value = index
        option.textContent = question.split(': ')[1]

        target.appendChild(option)
    })
}

document.addEventListener('DOMContentLoaded', function (event) {

    Promise.all([
        GET('./data/patterns.txt'),
        GET('./data/question-list.txt')
    ]).then(([ patterns, questions ]) => {
        addQuestions(questions)

        let geo = new Geomancer(
            $('#results'),
            $('#times'),
            $('#pattern'),
            new PatternTable(patterns)
        )

        $('#question').addEventListener('change', function (event) {
            geo.reset()
            if (this.value !== -1) {
                $('#geomancer-wrapper').style.display = 'inline-block'
                $('#results').style.display = 'inline-block'
                geo.setQuestion(this.value)
            } else {
                $('#geomancer-wrapper').style.display = 'none'
                $('#results').style.display = 'none'
            }
        })

        $('#roll').addEventListener('click', geo.roll.bind(geo))
    }, (err) => {
        console.log('error:', err)
        alert('Something went wrong!' + JSON.stringify(err || {}))
    })
})
