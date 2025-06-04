function addRow() {
  const tbody = document.getElementById('tableBody');
  const rowCount = tbody.children.length + 1;
  const row = document.createElement('tr');
  const cells = [
    '<td><input type="checkbox"/></td>',
    `<td>${rowCount}</td>`,
    '<td><input type="text"/></td>', // Product Code
    '<td><input type="text"/></td>', // Description
    '<td><input type="text"/></td>', // Invoice #
    '<td><input type="text" placeholder="DD-MM-YYYY"/></td>', // Invoice Date
    '<td><input type="text" placeholder="DD-MM-YYYY"/></td>', // Due Date
    '<td><input type="number"/></td>', // Quantity
    '<td><input type="number" readonly/></td>', // Unit Price (readonly)
    '<td><input type="number"/></td>', // Invoice Amount
    '<td><input type="text"/></td>', // Payment Doc
    '<td><input type="text" placeholder="DD-MM-YYYY"/></td>', // Payment Date
    '<td><input type="number"/></td>', // Payment Amount
    '<td><input type="number" placeholder="Discount PMT"/></td>', // Discount PMT (editable)
    '<td><input type="text" readonly/></td>', // Diff. Days (readonly, text for N.A.)
    '<td><input type="number" readonly/></td>', // Prop. Qty. (readonly)
    '<td class="discount-amount">-</td>', // Discount Amt (readonly, not input)
    '<td><input type="number" readonly /></td>', // Balance Amt. (readonly)
    '<td><input type="text"/></td>' // Remarks (editable)
  ];
  row.innerHTML = cells.join('');
  tbody.appendChild(row);
  updateSlNo();
  updateTotals();
  autoCalculateAll();
}

// Helper: Parse DD-MM-YYYY to Date object
function parseDDMMYYYY(str) {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split('-').map(Number);
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
}

function autoCalculateAll() {
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs.length < 19) return;

    const qty = parseFloat(inputs[7].value) || 0;
    const invAmt = parseFloat(inputs[9].value) || 0;
    const unitPrice = qty > 0 ? invAmt / qty : 0;
    inputs[8].value = (qty > 0 && invAmt > 0) ? unitPrice.toFixed(2) : '';

    const payAmt = parseFloat(inputs[12].value) || 0;
    const discPmt = parseFloat(inputs[13].value) || 0;
    const dueDate = inputs[6].value;
    const payDate = inputs[11].value;

    // 2. Diff. Days
    let diffDays = '';
    let diffDaysNum = 0;
    if (dueDate && payDate) {
      const dDue = parseDDMMYYYY(dueDate);
      const dPay = parseDDMMYYYY(payDate);
      if (dDue && dPay) {
        const days = Math.round((dDue - dPay) / (1000 * 60 * 60 * 24));
        if (days > 0) {
          diffDays = days;
          diffDaysNum = days;
        } else {
          diffDays = 'N.A.';
          diffDaysNum = 0;
        }
      }
    }
    inputs[14].value = diffDays;

    // 3. Prop Qty
    let propQty = 0;
    if (invAmt > 0) {
      propQty = qty * (payAmt / invAmt);
    }
    inputs[15].value = (invAmt > 0 && qty > 0 && payAmt > 0) ? propQty.toFixed(2) : '';

    // 4. Discount Amount
    let discountAmt = 0;
    if (diffDaysNum > 0 && propQty > 0 && discPmt > 0) {
      discountAmt = discPmt * diffDaysNum * propQty;
    }
    // Discount Amt cell is not an input, it's a text node
    let discountAmtCell = row.querySelector('.discount-amount');
    if (discountAmtCell) discountAmtCell.textContent = discountAmt ? discountAmt.toFixed(2) : '0.00';

    // 5. Net Due (Balance Amt)
    let netDue = invAmt - payAmt - discountAmt;
    inputs[17].value = (invAmt > 0 || payAmt > 0 || discountAmt > 0) ? netDue.toFixed(2) : '';
  });
}

// Attach auto-calc to all relevant inputs
document.getElementById('tableBody').addEventListener('input', function(e) {
  if (e.target.matches('input[type="text"], input[type="number"]')) {
    autoCalculateAll();
  }
});


// Initial calculation on page load
window.addEventListener('DOMContentLoaded', autoCalculateAll);

function exportCSV() {
  updateSlNo();
  updateTotals();
  const rows = [];
  document.querySelectorAll('#invoiceTable tr').forEach(tr => {
    const cells = Array.from(tr.querySelectorAll('th,td')).map(td => {
      if (td.querySelector('input')) return td.querySelector('input').value || '';
      return td.innerText;
    });
    rows.push(cells.join(','));
  });
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'discounts.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
        ${values.slice(0, 17).map((v, idx) =>
          idx === 14 || idx === 15 ? `<td><input type="number" readonly value="${v.replace(/"/g, '')}" /></td>`
          : idx === 16 ? `<td class="discount-amount">${v.replace(/"/g, '')}</td>`
          : `<td><input type="${idx >= 6 && idx <= 12 ? 'number' : 'text'}" value="${v.replace(/"/g, '')}" /></td>`
        ).join('')}
        <td><input type="number" readonly /></td>
        <td><input type="text"/></td>
      `;
      document.getElementById('tableBody').appendChild(row);
    });
    updateSlNo();
    updateTotals();
    autoCalculateAll(); // <-- Add this line
  };
  reader.readAsText(file);
}

function selectAll() {
  const checkboxes = document.querySelectorAll('#tableBody tr td:first-child input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
}

function deselectAll() {
  const checkboxes = document.querySelectorAll('#tableBody tr td:first-child input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
}

function removeSelected() {
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox && checkbox.checked) {
      row.remove();
    }
  });
  updateSlNo();
  updateTotals();
}

function resetSelected() {
  const rows = document.querySelectorAll('#tableBody tr');
  rows.forEach(row => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox && checkbox.checked) {
      const inputs = row.querySelectorAll('input[type="text"], input[type="number"]');
      inputs.forEach(input => {
        if (!input.hasAttribute('readonly')) input.value = '';
      });
      row.querySelector('.discount-amount').textContent = '-';
    }
  });
  updateTotals();
  autoCalculateAll(); // <-- Add this line
}

window.onload = function () {
  addRow();
  updateTotals();
};

// After all rows are added:
autoCalculateAll();

function computeRowValues({invoiceAmount, quantity, dueDate, paymentDate, paymentAmount, discountPMT}) {
  // Parse dates
  function parseDDMMYYYY(str) {
    if (!str) return null;
    const [dd, mm, yyyy] = str.split('-').map(Number);
    if (!dd || !mm || !yyyy) return null;
    return new Date(yyyy, mm - 1, dd);
  }
  // 1. Unit Price
  const unitPrice = quantity > 0 ? invoiceAmount / quantity : 0;
  // 2. Diff. Days
  let diffDays = '';
  let diffDaysNum = 0;
  if (dueDate && paymentDate) {
    const dDue = parseDDMMYYYY(dueDate);
    const dPay = parseDDMMYYYY(paymentDate);
    if (dDue && dPay) {
      const days = Math.round((dDue - dPay) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        diffDays = days;
        diffDaysNum = days;
      } else {
        diffDays = 'N.A.';
        diffDaysNum = 0;
      }
    }
  }
  // 3. Prop Qty
  let propQty = 0;
  if (invoiceAmount > 0) {
    propQty = quantity * (paymentAmount / invoiceAmount);
  }
  // 4. Discount Amount
  let discountAmt = 0;
  if (diffDaysNum > 0 && propQty > 0 && discountPMT > 0) {
    discountAmt = discountPMT * diffDaysNum * propQty;
  }
  // 5. Net Due
  let netDue = invoiceAmount - paymentAmount - discountAmt;

  return {
    unitPrice: unitPrice ? unitPrice.toFixed(2) : '',
    diffDays,
    propQty: propQty ? propQty.toFixed(2) : '',
    discountAmt: discountAmt ? discountAmt.toFixed(2) : '0.00',
    netDue: (invoiceAmount > 0 || paymentAmount > 0 || discountAmt > 0) ? netDue.toFixed(2) : ''
  };
}
