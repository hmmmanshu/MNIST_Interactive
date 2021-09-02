(async() => {
    const model = await tf.loadLayersModel('training/tfjs-model/model.json')

    const sketch = (p) => {
        let touchTime = Date.now()
        let drawCanvas
        let finalCanvas
        const displaySize = 600
        let scaleFactor = 1
        let reevaluate = true

        p.setup = () => {
            p.createCanvas(displaySize, displaySize)
            p.strokeWeight(0)
            p.stroke(220)
            drawCanvas = p.createGraphics(28, 28, 'p2d')
            scaleFactor = (28 / displaySize)
            drawCanvas.noSmooth()
            drawCanvas.pixelDensity(100)
            drawCanvas.strokeWeight(1.6)
            drawCanvas.stroke(255)
            finalCanvas = p.createGraphics(28, 28)
            finalCanvas.noSmooth()
            finalCanvas.pixelDensity(1)
            display()
            p.touchEnded()
            displayPredictions(d3.select('#d3'), new Array(10).fill(0))
            d3.select('#loading').remove()
        }

        p.touchStarted = () => {
            if (!insideCanvasState()) return true
            touchTime = Date.now() - touchTime
            if (touchTime > 600) {
                drawCanvas.clear()
            }
            drawCanvas.line(
                p.mouseX * scaleFactor,
                p.mouseY * scaleFactor,
                p.mouseX * scaleFactor,
                p.mouseY * scaleFactor
            )
            reevaluate = true
            display()
            return false
        }

        p.mousePressed = () => {
            p.touchStarted()
        }

        p.touchEnded = () => {
            if (reevaluate) {
                touchTime = Date.now()
                let prediction = model.predict(tf.tensor([getPixels()])).arraySync()[0]
                displayPredictions(d3.select('#d3'), prediction)
                reevaluate = false
            }
            if (!insideCanvasState()) return true
            return false
        }

        p.touchMoved = () => {
            drawCanvas.line(
                p.mouseX * scaleFactor,
                p.mouseY * scaleFactor,
                p.pmouseX * scaleFactor,
                p.pmouseY * scaleFactor
            )
            display()
        }

        function display() {
            p.background(250)
            p.push()
            p.blendMode(p.EXCLUSION)
            p.image(drawCanvas, 0, 0, displaySize, displaySize)
            p.pop()
            drawGrid()
        }

        function drawGrid() {
            for (let i = 0; i <= 28; i++) {
                p.line(i / scaleFactor, 0, i / scaleFactor, displaySize)
                p.line(0, i / scaleFactor, displaySize, i / scaleFactor)
            }
        }

        function insideCanvasState() {
            return (
                p.mouseX >= 0 &&
                p.mouseY >= 0 &&
                p.mouseX <= displaySize &&
                p.mouseY <= displaySize
            )
        }

        function getPixels() {
            let pixels = new Array(28)
            let alphachannel = 3
            finalCanvas.clear()
            finalCanvas.image(drawCanvas, 0, 0)
            finalCanvas.loadPixels()

            for (let i = 0; i < pixels.length; ++i) {
                pixels[i] = []
                for (let j = 0; j < pixels.length; ++j) {
                    pixelindex = pixels.length * i + j
                    actualindex = (pixelindex << 2) + alphachannel
                    pixels[i][j] = [finalCanvas.pixels[actualindex] / 255]
                }
            }
            return pixels
        }

        function displayPredictions(selection, prediction) {
            const svg = selection.selectAll('svg').data([null])
            const svgEnter = svg.enter().append('svg')
            svg.exit().remove()
            svg.merge(svgEnter).attr('viewBox', '0 0 150 210').attr('width', 300)

            svg
                .selectAll('rect')
                .data([null])
                .enter()
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('height', 210)
                .attr('width', 150)
                .attr('fill', 'transparent')

            const rowGroup = svg.selectAll('g').data(prediction)
            const rowGroupEnter = rowGroup
                .enter()
                .append('g')
                .attr('transform', (d, i) => `translate(0, ${20 + i * 20})`)
            rowGroup.exit().remove()

            rowGroupEnter.append('text').attr('x', 10)
            rowGroupEnter
                .append('rect')
                .attr('x', 25)
                .attr('y', -13)
                .attr('height', 16)
                .attr('rx', 1)
            rowGroup
                .merge(rowGroupEnter)
                .select('text')
                .text((d, i) => i)
            rowGroup
                .merge(rowGroupEnter)
                .select('rect')
                .transition()
                .attr('width', (d) => 112 * d + 0.0001)
        }
    }

    let myp5 = new p5(sketch, 'p5')
})()
