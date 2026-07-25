import React from 'react';

export default function Testimonials() {
  const testimonialsData = [
    {
      avatar: "JD",
      quote: "Transitioning to ResolveX reduced our average response bottleneck from 12 days to under 48 hours. The AI categorization has been game-changing.",
      author: "Mayor Janet Davis",
      dept: "City of Greenfield"
    },
    {
      avatar: "MC",
      quote: "Citizens now know exactly where their complaints are. We noticed a 40% reduction in status-check calls in the first month.",
      author: "Marcus Cole",
      dept: "Public Works Director"
    },
    {
      avatar: "SA",
      quote: "The security compliance on ResolveX met all our strict administrative requirements. Setup was completed in under two weeks.",
      author: "Sarah Jenkins",
      dept: "Chief Information Officer"
    },
    {
      avatar: "RT",
      quote: "Automated escalation triggers transformed our department SLA. Officer accountability has never been higher.",
      author: "Robert Torres",
      dept: "Civil Services Ombudsman"
    }
  ];

  const doubledTestimonials = [...testimonialsData, ...testimonialsData];

  return (
    <section className="section-testimonials" id="testimonials">
      <div className="container text-center reveal-on-scroll">
        <span className="section-tag">REVIEWS</span>
        <h2 className="section-title">Endorsed by Civic Leaders</h2>
      </div>

      {/* Testimonials Infinite Marquee */}
      <div className="carousel-wrapper reveal-on-scroll">
        <div className="marquee-container">
          <div className="marquee-track">
            {doubledTestimonials.map((item, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="t-rating">★★★★★</div>
                <p className="t-quote">"{item.quote}"</p>
                <div className="t-author">
                  <div className="t-avatar">{item.avatar}</div>
                  <div className="t-author-info">
                    <h4>{item.author}</h4>
                    <p>{item.dept}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
