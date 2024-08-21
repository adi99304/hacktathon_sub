let currentPage = "home";
let balance = 0;
let currentProductUID = "";
let html5QrCode;

function showPage(pageId) {
  document.querySelectorAll(".content-page").forEach((page) => {
    page.classList.add("hidden");
  });
  document.getElementById(pageId).classList.remove("hidden");
  document.querySelectorAll(".menu a").forEach((link) => {
    link.classList.remove("active");
  });
  document.getElementById(pageId + "-link").classList.add("active");
}

document.getElementById("home-link").addEventListener("click", () => {
  currentPage = "home";
  showPage("home");
});

document.getElementById("purchases-link").addEventListener("click", () => {
  currentPage = "purchases";
  showPage("purchases");
  fetchPurchases();
});

document.getElementById("load-balance-link").addEventListener("click", () => {
  currentPage = "load-balance";
  showPage("load-balance");
});

document.getElementById("scan-btn").addEventListener("click", () => {
  document.getElementById("qr-scanner").classList.remove("hidden");
  html5QrCode = new Html5Qrcode("qr-reader");
  html5QrCode
    .start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (qrCodeMessage) => {
        console.log(`QR Code detected: ${qrCodeMessage}`);
        html5QrCode
          .stop()
          .then(() => {
            document.getElementById("qr-scanner").classList.add("hidden");
            fetchProductInfo(qrCodeMessage);
          })
          .catch((err) => {
            console.error(`Error stopping QR code scanner: ${err}`);
          });
      },
      (errorMessage) => {
        console.warn(`QR Code no match: ${errorMessage}`);
      }
    )
    .catch((err) => {
      console.error(`Error starting QR code scanner: ${err}`);
    });
});

function fetchProductInfo(uid) {
  currentProductUID = uid;
  fetch(`https://hackathon-submission-q1mg.onrender.com/checkUID?uid=${uid}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
        return;
      }
      if (data.product.ProductOwner === "supermarket") {
        document.getElementById("purchase-btn").classList.remove("hidden");
        document.getElementById("return-btn").classList.add("hidden");
      } else {
        document.getElementById("purchase-btn").classList.add("hidden");
        document.getElementById("return-btn").classList.remove("hidden");
      }
      document.getElementById("product-name").innerText =
        data.product.ProductName || "---";
      document.getElementById("product-owner").innerText =
        data.product.ProductOwner || "---";
      document.getElementById("product-price").innerText =
        data.product.ProductPrice || "---";
      document.getElementById("product-image").src =
        data.product.ImageLink || "";
      showPage("product-page");
    })
    .catch((error) => {
      console.error("Error fetching product info:", error);
    });
}

document.getElementById("purchase-btn").addEventListener("click", () => {
  fetch(
    `https://hackathon-submission-q1mg.onrender.com/checkUID?uid=${currentProductUID}`,
    {
      method: "GET",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.product.ProductPrice <= balance) {
        fetch(
          `https://hackathon-submission-q1mg.onrender.com/purchaseProduct`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uid: currentProductUID }),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              balance -= data.product.ProductPrice;
              updateBalance();
              alert("Product purchased successfully!");
              document.getElementById("purchase-btn").classList.add("hidden");
              document.getElementById("return-btn").classList.remove("hidden");
              fetchPurchases();
            } else {
              alert("Error purchasing product!");
            }
          })
          .catch((error) => {
            console.error("Error purchasing product:", error);
          });
      } else {
        alert("Insufficient balance!");
      }
    });
});

document.getElementById("return-btn").addEventListener("click", () => {
  fetch(`https://hackathon-submission-q1mg.onrender.com/returnProduct`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid: currentProductUID }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        balance += data.product.ProductPrice; // Add the product price back to balance
        updateBalance();
        alert("Product returned successfully!");
        document.getElementById("return-btn").classList.add("hidden");
        document.getElementById("purchase-btn").classList.remove("hidden");
        fetchPurchases();
      } else {
        alert("Error returning product!");
      }
    })
    .catch((error) => {
      console.error("Error returning product:", error);
    });
});

function fetchPurchases() {
  fetch(`https://hackathon-submission-q1mg.onrender.com/purchases`)
    .then((response) => response.json())
    .then((data) => {
      const purchasesList = document.getElementById("purchases-list");
      purchasesList.innerHTML = "";
      if (data.length > 0) {
        const table = document.createElement("table");
        table.classList.add("product-table");
        const headerRow = document.createElement("tr");
        const headers = [
          "Product Name",
          "Product Owner",
          "Product Price",
          "Image",
          "Actions",
        ];
        headers.forEach((headerText) => {
          const header = document.createElement("th");
          header.innerText = headerText;
          headerRow.appendChild(header);
        });
        table.appendChild(headerRow);

        data.forEach((product) => {
          const row = document.createElement("tr");
          row.innerHTML = `
          <td>${product.ProductName || "---"}</td>
          <td>${product.ProductOwner || "---"}</td>
          <td>${product.ProductPrice || "---"}</td>
          <td><img src="${
            product.ImageLink || ""
          }" alt="Product Image" width="50" /></td>
          <td>
            <button class="button purchase-btn" data-uid="${product.UID}" ${
            product.ProductOwner !== "supermarket" ? "disabled" : ""
          }>Buy</button>
            <button class="button return-btn" data-uid="${product.UID}" ${
            product.ProductOwner === "supermarket" ? "disabled" : ""
          }>Return</button>
          </td>
        `;
          table.appendChild(row);
        });
        purchasesList.appendChild(table);

        document.querySelectorAll(".purchase-btn").forEach((button) => {
          button.addEventListener("click", (event) => {
            const uid = event.target.getAttribute("data-uid");
            fetch(
              `https://hackathon-submission-q1mg.onrender.com/purchaseProduct`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ uid }),
              }
            )
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  alert("Product purchased successfully!");
                  fetchPurchases();
                } else {
                  alert("Error purchasing product!");
                }
              })
              .catch((error) => {
                console.error("Error purchasing product:", error);
              });
          });
        });

        document.querySelectorAll(".return-btn").forEach((button) => {
          button.addEventListener("click", (event) => {
            const uid = event.target.getAttribute("data-uid");
            fetch(
              `https://hackathon-submission-q1mg.onrender.com/returnProduct`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ uid }),
              }
            )
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  alert("Product returned successfully!");
                  fetchPurchases();
                } else {
                  alert("Error returning product!");
                }
              })
              .catch((error) => {
                console.error("Error returning product:", error);
              });
          });
        });
      } else {
        purchasesList.innerHTML = "<p>No purchases found.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching purchases:", error);
    });
}

document.getElementById("add-balance-btn").addEventListener("click", () => {
  const amount = parseFloat(document.getElementById("amount").value);
  if (!isNaN(amount) && amount > 0) {
    balance += amount;
    updateBalance();
    alert(`Added $${amount.toFixed(2)} to balance!`);
  } else {
    alert("Please enter a valid amount.");
  }
});

function updateBalance() {
  document.getElementById("balance").innerText = `₹${balance.toFixed(2)}`;
}

showPage("home");
