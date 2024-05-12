import Chart from 'chart.js/auto'
import XLSX from 'xlsx'

class AuthorPositionChart {
  constructor () {
    this.myChart = null
    this.myLargeChart = null
    this.publications = null
    this.specificAuthor = null
    this.configuration = null
    this.lastAuthorshipPosition = false
    this.initEventListeners()
  }

  async init (xmlDoc, lastAuthorshipPosition) {
    try {
      const result = xmlDoc
      this.publications = result.querySelectorAll('dblpperson > r')
      this.specificAuthor = result.querySelector('dblpperson > person > author').textContent
      if (lastAuthorshipPosition === 1) {
        this.lastAuthorshipPosition = true
      } else {
        this.lastAuthorshipPosition = false
      }
      const initialFilters = {
        'informal': true,
        'data': true,
        'editor': true,
        'incollection': true,
        'inproceedings': true,
        'article': true
      }
      const yearCounts = this.countPublicationsByAuthorPosition(this.publications || [], this.specificAuthor, initialFilters)
      await this.createChart(yearCounts)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  }

  countPublicationsByAuthorPosition (publications, specificAuthor, filters) {
    const authorPositionCounts = {
      firstAuthor: {},
      secondAuthor: {},
      moreThanThirdAuthor: {},
      lastAuthor: {}
    }

    Array.from(publications).forEach(publication => {
      let pubType

      switch (publication.children[0].tagName) {
        case 'article':
          pubType = publication.children[0].getAttribute('publtype') === 'informal' ? 'informal' : 'article'
          break
        case 'inproceedings':
        case 'proceedings':
          pubType = 'inproceedings'
          break
        case 'editor':
          pubType = 'editor'
          break
        case 'data':
          pubType = 'data'
          break
        case 'incollection':
          pubType = 'incollection'
          break
      }

      if (filters[pubType]) {
        let authors = Array.from(publication.children[0].children).filter(element => element.tagName === 'author')
        // Ensure that authors is always an array
        if (!Array.isArray(authors)) {
          authors = [authors] // Wrap the object in an array
        }
        let year = Array.from(publication.children[0].children).find(element => element.tagName === 'year')
        if (year) {
          year = year.innerHTML
          // Find the position of the specific author
          const authorPosition = authors.findIndex(author => author.lastChild.data === specificAuthor || author.innerHTML === specificAuthor) + 1 // Adjust for 0-based index
          // Categorize by author position
          if (authorPosition === 1) {
            authorPositionCounts.firstAuthor[year] = (authorPositionCounts.firstAuthor[year] || 0) + 1
          } else if (authorPosition === 2) {
            authorPositionCounts.secondAuthor[year] = (authorPositionCounts.secondAuthor[year] || 0) + 1
          } else if (authorPosition > 2) {
            authorPositionCounts.moreThanThirdAuthor[year] = (authorPositionCounts.moreThanThirdAuthor[year] || 0) + 1
          }
          if (this.lastAuthorshipPosition && authorPosition === authors.length) {
            if (!authorPositionCounts.lastAuthor[year]) {
              authorPositionCounts.lastAuthor[year] = 0
            }
            authorPositionCounts.lastAuthor[year]++

            // Resta uno de secondAuthor o moreThanThirdAuthor si el último autor es el segundo o tercer autor
            if (authorPosition === 2 && authorPositionCounts.secondAuthor[year] > 0) {
              authorPositionCounts.secondAuthor[year]--
            } else if (authorPosition > 2 && authorPositionCounts.moreThanThirdAuthor[year] > 0) {
              authorPositionCounts.moreThanThirdAuthor[year]--
            }
          }
        }
      }
    })

    return authorPositionCounts
  }

  async initEventListeners () {
    const checkAndBind = () => {
      // Lista de IDs de todos los checkboxes de filtro
      const filterIds = [
        'show-informal', 'show-data', 'show-editor',
        'show-incollection', 'show-inproceedings', 'show-article'
      ]

      filterIds.forEach(id => {
        const checkbox = document.getElementById(id)
        if (checkbox) {
          checkbox.addEventListener('change', this.handleFilterChange.bind(this))
        }
      })
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndBind)
    } else {
      checkAndBind()
    }
  }

  async handleFilterChange (event) {
    const filters = {}
    const filterIds = [
      'show-informal', 'show-data', 'show-editor',
      'show-incollection', 'show-inproceedings', 'show-article'
    ]

    // Llenar el objeto de filtros con el estado actual de cada checkbox
    filterIds.forEach(id => {
      const checkbox = document.getElementById(id)
      if (checkbox) {
        filters[checkbox.id.replace('show-', '')] = checkbox.checked
      }
    })

    const categorizedAuthorPosition = this.countPublicationsByAuthorPosition(this.publications || [], this.specificAuthor, filters)
    await this.createChart(categorizedAuthorPosition)
  }
  prepareDataForExcel (authorPositionCounts) {
    const years = Object.keys({
      ...authorPositionCounts.firstAuthor,
      ...authorPositionCounts.secondAuthor,
      ...authorPositionCounts.moreThanThirdAuthor
    }).sort()

    return years.map(year => ({
      Year: year,
      'First Author': authorPositionCounts.firstAuthor[year] || 0,
      'Second Author': authorPositionCounts.secondAuthor[year] || 0,
      'More Than Third Author': authorPositionCounts.moreThanThirdAuthor[year] || 0
    }))
  }
  exportToExcel (authorPositionCounts) {
    const data = this.prepareDataForExcel(authorPositionCounts)
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Authorship Position')
    XLSX.writeFile(workbook, 'authorship_position.xlsx')
  }

  // Function to create and save the chart
  async createChart (authorPositionCounts) {
    const sortedYears = Object.keys({
      ...authorPositionCounts.firstAuthor,
      ...authorPositionCounts.secondAuthor,
      ...authorPositionCounts.moreThanThirdAuthor
    }).sort((a, b) => a - b)
    const datasets = [
      {
        label: 'First Author',
        data: sortedYears.map(year => authorPositionCounts.firstAuthor[year] || 0),
        backgroundColor: 'rgba(255, 99, 132)',
        stack: 'stacked' // This indicates that the bar should be stacked
      },
      {
        label: 'Second Author',
        data: sortedYears.map(year => authorPositionCounts.secondAuthor[year] || 0),
        backgroundColor: 'rgba(54, 162, 235)',
        stack: 'stacked' // This indicates that the bar should be stacked
      },
      {
        label: 'Beyond Third Author',
        data: sortedYears.map(year => authorPositionCounts.moreThanThirdAuthor[year] || 0),
        backgroundColor: 'rgba(255, 206, 86)',
        stack: 'stacked' // This indicates that the bar should be stacked
      }
    ]

    if (this.lastAuthorshipPosition) {
      datasets.push({
        label: 'Last Author',
        data: Object.values(authorPositionCounts.lastAuthor),
        backgroundColor: 'rgb(52,170,73)',
        stack: 'stacked'
      })
    }

    this.configuration = {
      type: 'bar',
      data: {
        labels: sortedYears,
        datasets: datasets
      },
      options: {
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            align: 'start'
          }
        }
      }
    }

    let normalCanvas = document.getElementById('myChartAuthorship')
    const div = document.getElementById('authorpage-refine')
    const largeCanvas = document.createElement('canvas')

    if (!normalCanvas) {
      // Create normal canvas element
      normalCanvas = document.createElement('canvas')
      normalCanvas.id = 'myChartAuthorship'
      normalCanvas.width = 800
      normalCanvas.height = 600

      // Create large canvas element
      largeCanvas.id = 'myLargeChartAuthorship'
      largeCanvas.width = 1100
      largeCanvas.height = 700
    } else {
      const normalCtx = normalCanvas.getContext('2d')
      this.myChart.destroy()
      normalCtx.clearRect(0, 0, normalCanvas.width, normalCanvas.height)
    }

    // Ensure this event handler is added in the createChart function after creating the chart instance
    normalCanvas.addEventListener('click', () => {
      this.toggleChartModal(normalCanvas, largeCanvas, authorPositionCounts, true) // Use an arrow function here
    })

    const previousTitle = document.getElementById('authorship-title')
    if (previousTitle) {
      previousTitle.remove()
    }

    const previousButton = document.getElementById('export-button-authorship')
    if (previousButton) {
      previousButton.remove()
    }

    // Append normal canvas to the page
    let title = document.createElement('p')
    title.id = 'authorship-title'
    let text = document.createElement('b')
    text.innerHTML = 'Authorship position'
    title.appendChild(text)
    div.insertBefore(normalCanvas, div.firstChild)
    div.insertBefore(title, normalCanvas)

    const exportButton = document.createElement('button')
    exportButton.textContent = 'Export to Excel'
    exportButton.id = 'export-button-authorship'
    exportButton.style.margin = '10px'
    exportButton.addEventListener('click', () => this.exportToExcel(authorPositionCounts).bind(this))
    div.insertBefore(exportButton, normalCanvas.nextSibling)

    // Get the context of the normal canvas and create the chart
    const normalCtx = normalCanvas.getContext('2d')
    this.myChart = new Chart(normalCtx, this.configuration)
  }

  toggleChartModal (normalCanvas, largeCanvas, authorPositionCounts, enlarge) {
    let backdrop = document.querySelector('.modal-backdrop')
    if (!backdrop) {
      backdrop = document.createElement('div')
      backdrop.classList.add('modal-backdrop')
      backdrop.style.display = 'none' // Initially hidden
      document.body.appendChild(backdrop)
    }

    if (enlarge) {
      // Apply modal-specific styles
      largeCanvas.classList.add('modal-canvas', 'modal-view')

      // Always remove the old chart and create a new one for consistency
      if (this.myLargeChart) {
        this.myLargeChart.destroy() // Destroy the old chart instance
      }
      // Get the context of the large canvas
      const largeCtx = largeCanvas.getContext('2d')
      // Clone the chart configuration and adjust as needed for the larger size
      let largeConfiguration = JSON.parse(JSON.stringify(this.configuration))
      largeConfiguration.options.maintainAspectRatio = false
      // Adjust other configuration options as needed
      largeConfiguration.options.scales.x.ticks.autoSkip = false
      largeConfiguration.options.scales.x.ticks.maxRotation = 90

      this.myLargeChart = new Chart(largeCtx, largeConfiguration) // Create a new chart instance

      backdrop.appendChild(largeCanvas)
      backdrop.style.display = 'flex'
      normalCanvas.style.display = 'none' // Hide the normal canvas

      backdrop.onclick = () => {
        this.toggleChartModal(normalCanvas, largeCanvas, authorPositionCounts, false)
      }
    } else {
      // Remove modal-specific styles
      largeCanvas.classList.remove('modal-canvas', 'modal-view')

      // Move the normal canvas back into the main page and hide the modal
      backdrop.removeChild(largeCanvas)
      backdrop.style.display = 'none'
      normalCanvas.style.display = 'block' // Show the normal canvas

      // If needed, update the normal chart instance
      this.myChart.update()
    }
  }
}

export default AuthorPositionChart
