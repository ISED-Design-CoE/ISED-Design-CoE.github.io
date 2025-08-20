document.addEventListener("DOMContentLoaded", () => {
  const personalFieldsContainer = document.getElementById(
    "personal-fields-container"
  );
  const addpersonalButton = document.getElementById("add-personal-button");
  const maxpersonals = 3;
  let personalCount = 1; // Start with the first personal input

  // Function to create a new personal input and its remove button
  const createpersonalField = () => {
    personalCount++;

    // Create a new wrapper for the personal input and remove button
    const personalWrapper = document.createElement("div");
    personalWrapper.classList.add("personal-input-wrapper");

    // Create the new personal input
    const newpersonalInput = document.createElement("gcds-input");
    newpersonalInput.setAttribute(
      "input-id",
      `personal-${personalCount}-input`
    );
    newpersonalInput.setAttribute("label", "personal Address");
    newpersonalInput.setAttribute("name", "personal[]"); // Use array notation for multiple personals
    newpersonalInput.setAttribute("type", "personal");
    newpersonalInput.setAttribute("hint", "Optional"); // All additional personals are optional

    // Create a container for the remove button to manage alignment
    const removeButtonContainer = document.createElement("div");
    removeButtonContainer.classList.add("remove-personal-button-container");

    // Create the remove button as a gcds-button
    const removeButton = document.createElement("gcds-button");
    removeButton.setAttribute("type", "button");
    removeButton.setAttribute("variant", "secondary"); // Use secondary for a less prominent style
    removeButton.textContent = "Remove"; // Text for the button

    removeButton.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent form submission
      personalWrapper.remove();
      // Disable the add button if we are now below the max count
      if (personalCount <= maxpersonals) {
        addpersonalButton.disabled = false;
      }
      personalCount--; // Decrement count when an personal is removed
    });

    // Append the remove button to its container
    removeButtonContainer.appendChild(removeButton);

    // Append the input and the remove button container to the wrapper
    personalWrapper.appendChild(newpersonalInput);
    personalWrapper.appendChild(removeButtonContainer);

    return personalWrapper;
  };

  addpersonalButton.addEventListener("click", () => {
    // Check if we've reached the maximum number of personals
    if (personalCount < maxpersonals) {
      const newpersonalField = createpersonalField();
      personalFieldsContainer.appendChild(newpersonalField);

      // Disable the add button if we've reached the maximum
      if (personalCount === maxpersonals) {
        addpersonalButton.disabled = true;
      }
    }
  });
});
