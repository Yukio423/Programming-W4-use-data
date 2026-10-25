// Table and chart share one dataset. CSV is parsed only once on a web server.
const fields = ['EmployerName', 'DiffMeanHourlyPercent', 'DiffMedianHourlyPercent', 'FemaleTopQuartile', 'EmployerSize'];
const tbody = document.querySelector('#dataTable tbody');
const search = document.querySelector('#search');
const size = document.querySelector('#size');
const sort = document.querySelector('#sort');
const measure = document.querySelector('#measure');
let chart;

// Keep direct file opening working by reading the existing HTML rows once.
let employers = Array.from(tbody.rows, tr => Object.fromEntries(
  fields.map((field, i) => [field, tr.cells[i].textContent.trim()])
));

function cleanNumber(value) {
  if (value === undefined || String(value).trim() === '') return null;
  const number = Number(String(value).replace(/[%,$\s]/g, ''));
  return Number.isFinite(number) ? number : null;
}

function filteredRows() {
  const query = search.value.trim().toLowerCase();
  const rows = employers.filter(row =>
    row.EmployerName.toLowerCase().includes(query) &&
    (!size.value || row.EmployerSize === size.value)
  );
  const settings = {
    'median-desc': ['DiffMedianHourlyPercent', -1],
    'median-asc': ['DiffMedianHourlyPercent', 1],
    'mean-desc': ['DiffMeanHourlyPercent', -1],
    'women-desc': ['FemaleTopQuartile', -1]
  };
  rows.sort((a, b) => {
    const byName = a.EmployerName.localeCompare(b.EmployerName);
    if (sort.value === 'name') return byName;
    const [field, direction] = settings[sort.value];
    const first = cleanNumber(a[field]);
    const second = cleanNumber(b[field]);
    if (first === null) return second === null ? byName : 1;
    if (second === null) return -1;
    return direction * (first - second) || byName;
  });
  return rows;
}

function updateChart(rows) {
  const status = document.querySelector('#chart-status');
  if (typeof Chart === 'undefined') {
    status.textContent = 'Chart library could not load. Check your internet connection and reload. All figures remain available in the table.';
    return;
  }
  const selected = rows.slice(0, 15);
  document.querySelector('#chart-note').textContent =
    `Showing the first ${selected.length} of ${rows.length} matching employers in the current table order (maximum 15). Search, filter or sort to change the comparison.`;
  status.textContent = rows.length ? '' : 'No matching employers. Clear the filters to see the chart.';
  const metric = measure.options[measure.selectedIndex].text;
  const values = selected.map(row => cleanNumber(row[measure.value]));
  const labels = selected.map(row => row.EmployerName);
  const dataset = {
    label: `${metric} (%)`,
    data: values,
    backgroundColor: values.map(value => value < 0 ? '#476e76' : '#985a55'),
    maxBarThickness: 24
  };
  document.querySelector('#payGapChart').setAttribute('aria-label',
    `${metric} for ${selected.length} employers in the current table order. Exact values are in the table below.`);
  document.querySelector('.chart-container').style.height = `${Math.max(240, selected.length * 38 + 70)}px`;
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets = [dataset];
    chart.options.scales.x.title.text = `${metric} (%)`;
    chart.update();
    return;
  }
  chart = new Chart(document.querySelector('#payGapChart'), {
    type: 'bar',
    data: { labels, datasets: [dataset] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: context => `${metric}: ${context.parsed.x}%` } }
      },
      scales: {
        x: { beginAtZero: true, title: { display: true, text: `${metric} (%)` },
          ticks: { callback: value => `${value}%` } },
        y: { grid: { display: false }, ticks: { autoSkip: false, font: { size: 11 },
          callback: function(value) {
            const label = this.getLabelForValue(value);
            return label.length > 34 ? `${label.slice(0, 31)}…` : label;
          } }
        }
      }
    }
  });
}

function render() {
  const rows = filteredRows();
  tbody.replaceChildren();
  rows.forEach(row => {
    const tr = document.createElement('tr');
    fields.forEach(field => {
      const td = document.createElement('td');
      td.textContent = row[field];
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = fields.length;
    td.textContent = 'No matching employers. Try another search or reset the filters.';
    tr.appendChild(td);
    tbody.appendChild(tr);
  }
  document.querySelector('#result-count').textContent = `Showing ${rows.length} of ${employers.length} employers.`;
  updateChart(rows);
}

function initialise() {
  const previousSize = size.value;
  size.replaceChildren(new Option('All sizes', ''));
  const sizes = [...new Set(employers.map(row => row.EmployerSize))];
  sizes.sort((a, b) => {
    const lowerBound = value => value === 'Less than 250' ? 0 : Number(value.match(/\d+/)?.[0] || Infinity);
    return lowerBound(a) - lowerBound(b);
  });
  sizes.forEach(value => size.add(new Option(value, value)));
  size.value = sizes.includes(previousSize) ? previousSize : '';
  render();
}

search.addEventListener('input', render);
[size, sort, measure].forEach(control => control.addEventListener('change', render));
document.querySelector('#reset').addEventListener('click', () => {
  search.value = '';
  size.value = '';
  sort.value = 'name';
  measure.value = 'DiffMedianHourlyPercent';
  render();
});
initialise();

// The teacher's Papa.parse method feeds both the table and the chart.
if (window.location.protocol !== 'file:' && typeof Papa !== 'undefined') {
  Papa.parse('media-pay-gap.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      if (results.errors.length || !fields.every(field => results.meta.fields?.includes(field))) {
        document.querySelector('#load-note').textContent = 'CSV could not be read. Showing the saved HTML data.';
        return;
      }
      employers = results.data;
      console.log('running', employers);
      initialise();
    },
    error: function(err) {
      console.error('FAILED', err);
      document.querySelector('#load-note').textContent = 'CSV could not load. Showing the saved HTML data.';
    }
  });
} else {
  document.querySelector('#load-note').textContent = 'Showing the saved HTML data. On a web server, this page reads the CSV automatically.';
}
