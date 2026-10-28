/**
 * PennyWise - Gemini Visual Product Search Controller
 * Uses Google Gemini Vision API to identify products from photos and auto-fill search fields.
 * Styled with Pigeon's Mission Neo-Brutalist Arcade Design System.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const modal = document.getElementById("vision-modal");
  const fileInput = document.getElementById("vision-file-input");
  const dropzone = document.getElementById("vision-dropzone");
  const btnClose = document.getElementById("btn-close-vision-modal");
  const btnRetry = document.getElementById("btn-vision-retry");
  const btnApply = document.getElementById("btn-apply-vision-result");
  const triggerBtns = document.querySelectorAll(".btn-trigger-vision");

  // State Containers inside Modal
  const stateDrop = document.getElementById("vision-state-drop");
  const stateScanning = document.getElementById("vision-state-scanning");
  const stateSuccess = document.getElementById("vision-state-success");
  const stateError = document.getElementById("vision-state-error");

  // Dynamic Content Elements
  const previewImg = document.getElementById("vision-preview-img");
  const successThumb = document.getElementById("vision-success-thumb");
  const identifiedTitle = document.getElementById("vision-identified-title");
  const identifiedBrand = document.getElementById("vision-identified-brand");
  const identifiedCategory = document.getElementById("vision-identified-category");
  const errorMsg = document.getElementById("vision-error-msg");

  // Search Fields Detection (Home vs Results Page)
  const searchNameInput = document.getElementById("search-name") || document.getElementById("results-search-name");
  const searchBrandInput = document.getElementById("search-brand") || document.getElementById("results-search-brand");
  const searchForm = document.getElementById("search-form") || document.getElementById("results-search-form");

  let lastIdentifiedResult = null;

  // Show Specific Modal State
  function showVisionState(state) {
    if (stateDrop) stateDrop.classList.add("hidden");
    if (stateScanning) stateScanning.classList.add("hidden");
    if (stateSuccess) stateSuccess.classList.add("hidden");
    if (stateError) stateError.classList.add("hidden");

    if (state === "drop" && stateDrop) stateDrop.classList.remove("hidden");
    if (state === "scanning" && stateScanning) stateScanning.classList.remove("hidden");
    if (state === "success" && stateSuccess) stateSuccess.classList.remove("hidden");
    if (state === "error" && stateError) stateError.classList.remove("hidden");
  }

  // Open Modal
  function openVisionModal() {
    if (!modal) return;
    showVisionState("drop");
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  // Close Modal
  function closeVisionModal() {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    if (fileInput) fileInput.value = "";
  }

  // Triggers
  triggerBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openVisionModal();
    });
  });

  if (btnClose) {
    btnClose.addEventListener("click", closeVisionModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeVisionModal();
      }
    });
  }

  // Dropzone click -> file input
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => {
      fileInput.click();
    });

    // Drag & Drop
    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("bg-[#BBDCF4]/30", "border-[#EE2D2B]");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("bg-[#BBDCF4]/30", "border-[#EE2D2B]");
      });
    });

    dropzone.addEventListener("drop", (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        handleImageFile(files[0]);
      }
    });
  }

  // File Input Changed
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleImageFile(fileInput.files[0]);
      }
    });
  }

  // Retry Button
  if (btnRetry) {
    btnRetry.addEventListener("click", () => {
      showVisionState("drop");
      if (fileInput) fileInput.click();
    });
  }

  // Paste Support (Ctrl+V)
  window.addEventListener("paste", (e) => {
    if (!modal || modal.classList.contains("hidden")) return;
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
      const item = items[index];
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        handleImageFile(blob);
        break;
      }
    }
  });

  // Handle Image File -> Convert to Data URL & Call Gemini Vision API
  function handleImageFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError("Image size exceeds 10MB limit. Please choose a smaller file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
      const dataUrl = e.target.result;

      // Show Scanning State
      if (previewImg) previewImg.src = dataUrl;
      showVisionState("scanning");

      try {
        const response = await fetch("/api/vision/identify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: dataUrl,
            mime_type: file.type
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.name) {
          lastIdentifiedResult = data;
          showSuccess(data, dataUrl);
        } else {
          showError(data.error || "Unable to detect a recognizable product in this image. Try taking a photo with the product clearly centered.");
        }
      } catch (err) {
        console.error("Gemini Vision identification error:", err);
        showError("Failed to connect to vision service. Please check connection and verify GEMINI_API_KEY in .env.");
      }
    };

    reader.onerror = function () {
      showError("Failed to read the image file from your device.");
    };

    reader.readAsDataURL(file);
  }

  // Show Success Screen
  function showSuccess(data, dataUrl) {
    if (successThumb) successThumb.src = dataUrl;
    if (identifiedTitle) identifiedTitle.textContent = data.name;
    
    if (identifiedBrand) {
      if (data.brand) {
        identifiedBrand.textContent = data.brand;
        identifiedBrand.classList.remove("hidden");
      } else {
        identifiedBrand.classList.add("hidden");
      }
    }

    if (identifiedCategory) {
      identifiedCategory.textContent = data.category || "General";
    }

    showVisionState("success");
  }

  // Show Error Screen
  function showError(msg) {
    if (errorMsg) errorMsg.textContent = msg;
    showVisionState("error");
  }

  // Apply Result to Search Console
  function applyIdentifiedResult() {
    if (!lastIdentifiedResult) return;

    const { name, brand, search_query } = lastIdentifiedResult;

    // Fill Product Name
    if (searchNameInput) {
      searchNameInput.value = name;
      // Visual feedback: brief tactile gold ring animation
      searchNameInput.classList.add("ring-4", "ring-[#F5B72B]");
      setTimeout(() => {
        searchNameInput.classList.remove("ring-4", "ring-[#F5B72B]");
      }, 1800);
    }

    // Fill Brand / Store
    if (searchBrandInput) {
      searchBrandInput.value = brand || "";
      if (brand) {
        searchBrandInput.classList.add("ring-4", "ring-[#96D4C7]");
        setTimeout(() => {
          searchBrandInput.classList.remove("ring-4", "ring-[#96D4C7]");
        }, 1800);
      }
    }

    closeVisionModal();

    // Contextual handling: If on results page, execute live crawl immediately
    if (window.location.pathname.includes("results.html") && typeof window.executeLiveSearch === "function") {
      const activeQuery = search_query || (brand ? `${brand} ${name}`.trim() : name);
      const params = new URLSearchParams();
      params.set("name", name);
      if (brand) params.set("brand", brand);
      params.set("q", activeQuery);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ path: newUrl }, "", newUrl);
      window.executeLiveSearch(activeQuery, false);
    } else if (searchForm) {
      // On home page, focus the submit button or prompt the user
      const submitBtn = searchForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.focus();
        submitBtn.classList.add("ring-4", "ring-[#F5B72B]");
        setTimeout(() => {
          submitBtn.classList.remove("ring-4", "ring-[#F5B72B]");
        }, 2000);
      }
    }
  }

  if (btnApply) {
    btnApply.addEventListener("click", applyIdentifiedResult);
  }
});
