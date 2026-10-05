import { Star } from "lucide-react";

function ReviewStars({ value, onChange, disabled = false, label = "Rate this product" }) {
  return (
    <div className="review-star-picker" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          className={rating <= value ? "is-selected" : ""}
          type="button"
          role="radio"
          aria-checked={value === rating}
          aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
          key={rating}
          disabled={disabled}
          onClick={() => onChange(rating)}
        >
          <Star size={20} fill={rating <= value ? "currentColor" : "none"} />
        </button>
      ))}
      <span className="review-star-value">{value ? `${value} / 5` : "Select a rating"}</span>
    </div>
  );
}

export default ReviewStars;
