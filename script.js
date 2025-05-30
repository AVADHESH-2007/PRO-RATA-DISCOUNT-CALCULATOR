function addRow() {
  const tbody = document.getElementById('tableBody');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="checkbox"/></td>
    <td>${tbody.children.length + 1}</td>
    <td><input type="text"/></td>
    <td><input type="text"/></td>
    <td><input type="text"/></td>
    <td><input type="text" placeholder="DD-MM-YYYY"/></td>
    <td><input type="text" placeholder="DD-MM-YYYY"/></td>
    <td><input type="number"/></td>
    <td><input type="number"/></td>
    <td><input type="number"/></td>
    <td><input type="text"/></td>
    <td><input type="text" placeholder="DD-MM-YYYY"/></td>
    <td><input type="number"/></td>
    <td><input type="number"/></td>
    <td class="discount-amount">-</td>
  `;
  tbody.appendChild(row);
}

function calculateDiscounts() {
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const amount = parseFloat(inputs[8].value) || 0;
    const discountRate = parseFloat(inputs[12].value) || 0;
    const discountAmt = (amount * discountRate / 100).toFixed(2);
    row.querySelector('.discount-amount').innerText = discountAmt;
  });
}

function exportCSV() {
  const rows = document.querySelectorAll('#invoiceTable tr');
  const csv = [];
  rows.forEach(row => {
    const cols = Array.from(row.querySelectorAll('th, td')).map(cell =>
      cell.innerText || cell.querySelector('input')?.value || ''
    );
    csv.push(cols.join(','));
  });
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const tempLink = document.createElement('a');
  tempLink.href = URL.createObjectURL(blob);
  tempLink.download = 'discount_calculator.csv';
  tempLink.click();
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const lines = content.split('\n').filter(Boolean);
    document.getElementById('tableBody').innerHTML = '';
    lines.slice(1).forEach((line, i) => {
      const values = line.split(',');
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="checkbox"/></td>
        <td>${i + 1}</td>
        ${values.slice(1, 13).map((v, idx) => `<td><input type="${idx >= 6 && idx <= 12 ? 'number' : 'text'}" value="${v.replace(/"/g, '')}" /></td>`).join('')}
        <td class="discount-amount">-</td>
      `;
      document.getElementById('tableBody').appendChild(row);
    });
  };
  reader.readAsText(file);
}

function selectAll() {
  const checkboxes = document.querySelectorAll('#tableBody input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
}

function deselectAll() {
  const checkboxes = document.querySelectorAll('#tableBody input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
}

window.onload = function () {
  addRow();
};