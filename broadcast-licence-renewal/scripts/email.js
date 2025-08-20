document.addEventListener("DOMContentLoaded", () => {
  const emailFieldsContainer = document.getElementById(
    "email-fields-container"
  );
  const addEmailButton = document.getElementById("add-email-button");
  const maxEmails = 3;
  let emailCount = 1; // Start with the first email input

  // Function to create a new email input and its remove button
  const createEmailField = () => {
    emailCount++;

    // Create a new wrapper for the email input and remove button
    const emailWrapper = document.createElement("div");
    emailWrapper.classList.add("email-input-wrapper");

    // Create the new email input
    const newEmailInput = document.createElement("gcds-input");
    newEmailInput.setAttribute("input-id", `email-${emailCount}-input`);
    newEmailInput.setAttribute("label", "Email Address");
    newEmailInput.setAttribute("name", "email[]"); // Use array notation for multiple emails
    newEmailInput.setAttribute("type", "email");
    newEmailInput.setAttribute("hint", "Optional"); // All additional emails are optional

    // Create a container for the remove button to manage alignment
    const removeButtonContainer = document.createElement("div");
    removeButtonContainer.classList.add("remove-email-button-container");

    // Create the remove button as a gcds-button
    const removeButton = document.createElement("gcds-button");
    removeButton.setAttribute("type", "button");
    removeButton.setAttribute("variant", "secondary"); // Use secondary for a less prominent style
    removeButton.textContent = "Remove"; // Text for the button

    removeButton.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent form submission
      emailWrapper.remove();
      // Disable the add button if we are now below the max count
      if (emailCount <= maxEmails) {
        addEmailButton.disabled = false;
      }
      emailCount--; // Decrement count when an email is removed
    });

    // Append the remove button to its container
    removeButtonContainer.appendChild(removeButton);

    // Append the input and the remove button container to the wrapper
    emailWrapper.appendChild(newEmailInput);
    emailWrapper.appendChild(removeButtonContainer);

    return emailWrapper;
  };

  addEmailButton.addEventListener("click", () => {
    const newEmailField = createEmailField();
    emailFieldsContainer.appendChild(newEmailField);
  });
});
