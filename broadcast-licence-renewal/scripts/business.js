document.addEventListener("DOMContentLoaded", () => {
  const businessFieldsContainer = document.getElementById(
    "business-fields-container"
  );
  const addbusinessButton = document.getElementById("add-business-button");
  const maxbusinesss = 3;
  let businessCount = 1; // Start with the first business input

  // Function to create a new business input and its remove button
  const createbusinessField = () => {
    businessCount++;

    // Create a new wrapper for the business input and remove button
    const businessWrapper = document.createElement("div");
    businessWrapper.classList.add("business-input-wrapper");

    // Create the new business input
    const newbusinessInput = document.createElement("gcds-input");
    newbusinessInput.setAttribute(
      "input-id",
      `business-${businessCount}-input`
    );
    newbusinessInput.setAttribute("label", "business Address");
    newbusinessInput.setAttribute("name", "business[]"); // Use array notation for multiple businesss
    newbusinessInput.setAttribute("type", "business");
    newbusinessInput.setAttribute("hint", "Optional"); // All additional businesss are optional

    // Create a container for the remove button to manage alignment
    const removeButtonContainer = document.createElement("div");
    removeButtonContainer.classList.add("remove-business-button-container");

    // Create the remove button as a gcds-button
    const removeButton = document.createElement("gcds-button");
    removeButton.setAttribute("type", "button");
    removeButton.setAttribute("variant", "secondary"); // Use secondary for a less prominent style
    removeButton.textContent = "Remove"; // Text for the button

    removeButton.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent form submission
      businessWrapper.remove();
      // Disable the add button if we are now below the max count
      if (businessCount <= maxbusinesss) {
        addbusinessButton.disabled = false;
      }
      businessCount--; // Decrement count when an business is removed
    });

    // Append the remove button to its container
    removeButtonContainer.appendChild(removeButton);

    // Append the input and the remove button container to the wrapper
    businessWrapper.appendChild(newbusinessInput);
    businessWrapper.appendChild(removeButtonContainer);

    return businessWrapper;
  };

  addbusinessButton.addEventListener("click", () => {
    // Check if we've reached the maximum number of businesss
    if (businessCount < maxbusinesss) {
      const newbusinessField = createbusinessField();
      businessFieldsContainer.appendChild(newbusinessField);

      // Disable the add button if we've reached the maximum
      if (businessCount === maxbusinesss) {
        addbusinessButton.disabled = true;
      }
    }
  });
});
