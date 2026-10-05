import { useEffect, useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { getAdminReviews } from "../services/adminService";

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    getAdminReviews()
      .then((response) => {
        if (active) setReviews(response.data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.response?.data?.message || "Unable to load product reviews.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reviews;
    return reviews.filter((review) =>
      [review.productName, review.author, review.text]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [reviews, search]);

  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + (Number(review.rating) || 0), 0) / reviews.length
    : 0;

  return (
    <div className="reference-content-wrap">
      <AdminHeader title="Product Reviews" eyebrow="Customer Feedback" />
      <main className="admin-reviews-page">
        <section className="admin-reviews-summary" aria-label="Review summary">
          <div>
            <span>Total reviews</span>
            <strong>{reviews.length}</strong>
          </div>
          <div>
            <span>Average rating</span>
            <strong><Star size={19} fill="currentColor" /> {averageRating.toFixed(1)} / 5</strong>
          </div>
        </section>

        <div className="admin-reviews-toolbar">
          <label className="admin-reviews-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search product, customer, or review"
              aria-label="Search product reviews"
            />
          </label>
          <span>{filteredReviews.length} {filteredReviews.length === 1 ? "review" : "reviews"}</span>
        </div>

        {loading && <p className="admin-reviews-message">Loading reviews...</p>}
        {error && <p className="toast-error" role="alert">{error}</p>}
        {!loading && !error && !filteredReviews.length && (
          <p className="admin-reviews-message">
            {reviews.length ? "No reviews match your search." : "No product reviews have been posted yet."}
          </p>
        )}

        <section className="admin-reviews-list" aria-label="Customer product reviews">
          {filteredReviews.map((review) => (
            <article className="admin-review-card" key={review.id}>
              <div className="admin-review-card-heading">
                <div>
                  <p className="eyebrow">{review.productName}</p>
                  <span>{review.author || "Customer"}</span>
                </div>
                <time dateTime={review.createdAt}>
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Date unavailable"}
                </time>
              </div>
              <div className="admin-review-rating" aria-label={`${review.rating || 0} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={17}
                    fill={index < (Number(review.rating) || 0) ? "currentColor" : "none"}
                  />
                ))}
                <strong>{Number(review.rating) || 0} / 5</strong>
              </div>
              <p className="admin-review-text">{review.text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Reviews;
