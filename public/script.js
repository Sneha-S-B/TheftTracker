// Auto-fill form if referenceId is in URL
window.onload = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const referenceId = urlParams.get("referenceId");

  const hideSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) section.style.display = "none";
  };

  const showSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) section.style.display = "block"; // Or "flex" depending on your layout
  };

  if (referenceId) {
    try {
      const res = await fetch(`/api/faults/${referenceId}`);
      if (!res.ok) throw new Error("No theft found.");
      const data = await res.json();
      fillFormWithData(data);
      document.getElementById("refIdDisplay").textContent = referenceId;
      document.getElementById("referenceId").value = referenceId;
      // document.getElementById("refIncidentphoto1").value = refIncidentphoto1;


      // Disable theft Description fields
      const faultDescriptionSection = document.querySelector('.form-section');
      const inputs = faultDescriptionSection.querySelectorAll('input, select, textarea, button');
      inputs.forEach(input => input.disabled = true);

      // Show middle and lower sections and lower1
      showSection('actionPlan');
      showSection('closureDetails');
      showSection('insuranceTracker');
      // hideSection('Photosection');
    } catch (err) {
      console.error(err);
      // alert("Failed to load theft data for editing.");
    }
  } else {
    // Hide middle and lower sections if no referenceId
    hideSection('actionPlan');
    hideSection('closureDetails');
    hideSection('insuranceTracker');
    // showSection('Photosection');
  }
};

// 2)FORM DATA PREFILL Function
// iterates through the keys of fetchede data 
// fills matching inputfields in the form using the name attributes

function formatDateOnly(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toISOString().split("T")[0]; // Returns 'YYYY-MM-DD'
}

function fillFormWithData(data) {
  const form = document.getElementById("faultForm");

  Object.keys(data).forEach(key => {
    if (key === 'incidentPhoto' || key === 'incidentPhoto1' ) return;
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      // If input is a date field, format it properly
      if (input.type === "date") {
        input.value = formatDateOnly(data[key]);
      } else {
        input.value = data[key];
      }
    }
  });
}
// 3) Sends GET req to /api/generate-id on backend
// displays the new referenceId and stores it in hodden field
async function generateReferenceId() {
  try {
    const res = await fetch("/api/generate-id");
    const data = await res.json();
    const refId = data.referenceId;
    document.getElementById("refIdDisplay").textContent = refId;
    document.getElementById("referenceId").value = refId;
  } catch (error) {
    console.error("Error generating reference ID:", error);
    alert("Failed to generate Reference ID. Please try again.");
  }
}

// Handle form submission
//Collects data and images into FormData.
//Sends the data to backend using POST (or PUT if editing).
//Alerts success or failure.
document.getElementById("faultForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  // Step 1: Remove "required" from hidden fields and clear values
  const hiddenSections = ["actionPlan", "closureDetails", "insurnaceTracker"];
  hiddenSections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section && section.style.display === "none") {
      const inputs = section.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.removeAttribute("required");
        input.value = ""; // Ensure it's submitted as an empty string
      });
    }
  });

  // Step 2: Collect form data into a JS object
  const formData = new FormData(this);
  const entry = {};
  formData.forEach((value, key) => entry[key] = value);

  if (!entry.referenceId) {
    alert("Please generate the Reference ID first!");
    return;
  }

  const isEdit = new URLSearchParams(window.location.search).get("referenceId");
  const url = isEdit
    ? `/api/faults/${entry.referenceId}`
    : `/api/faults`;
  const method = isEdit ? "PUT" : "POST";

  try {
    let res;

    if (isEdit) {
      // PUT: Send plain JSON (no files)
      const formData1 = new FormData();
      formData1.append('json_data', JSON.stringify(entry));

      // Add image files if present in form inputs
      const imageFile = document.querySelector('input[name="incidentPhoto"]').files[0];
      const imageFile1 = document.querySelector('input[name="incidentPhoto1"]').files[0];
      if (imageFile) formData1.append('image', imageFile);
      if (imageFile1) formData1.append('image1', imageFile1);

      res = await fetch(url, {
        method: "PUT",
        body: formData1
      });
    } else {
      // POST: Send multipart/form-data (files + JSON)
      const formData1 = new FormData();
      formData1.append('json_data', JSON.stringify(entry));

      // Add image files if present in form inputs
      const imageFile = document.querySelector('input[name="incidentPhoto"]').files[0];
      const imageFile1 = document.querySelector('input[name="incidentPhoto1"]').files[0];
      if (imageFile) formData1.append('image', imageFile);
      if (imageFile1) formData1.append('image1', imageFile1);

      res = await fetch(url, {
        method: "POST",
        body: formData1
      });
    }

    const result = await res.json();

    if (res.ok) {
      alert(isEdit ? "Theft updated successfully!" : "Data submitted successfully!");
      this.reset();
      document.getElementById("refIdDisplay").textContent = "Not Generated";
      if (isEdit) window.location.href = 'data.html'; // Redirect after update
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    console.error("Submission error:", error);
    alert("Failed to submit data. Please try again.");
  }
});


const fileInput = document.getElementById('photoUpload');
const message = document.getElementById('message');

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    fileInput.disabled = true; // disable the input
    message.textContent = "Photo uploaded. You can't upload again.";
  }
});
