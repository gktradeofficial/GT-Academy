const bookingButton = document.getElementById("book-session-btn");
const bookingConfirmed = document.getElementById("booking-confirmed");
const topicInput = document.getElementById("topic-input");
const bookingOptions = document.querySelectorAll(".booking-option");

bookingOptions.forEach((option) => {
  option.addEventListener("click", () => {
    bookingOptions.forEach((item) => item.classList.remove("active"));
    option.classList.add("active");
  });
});

bookingButton.addEventListener("click", () => {
  if (!topicInput.value.trim()) {
    topicInput.focus();
    topicInput.placeholder = "Add one concept so the teacher can prepare";
    return;
  }
  bookingButton.textContent = "Payment confirmed ✓";
  bookingButton.disabled = true;
  bookingConfirmed.hidden = false;
});
