import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

const Tabs = ({ days, activeTab, setActiveTab, hasPrebooking, isEditing }) => {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [days]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350); // allow scroll animation to settle before checking
    }
  };

  const handleTabClick = (index, e) => {
    setActiveTab(`day-${index}`);

    if (scrollRef.current && scrollRef.current.scrollWidth > scrollRef.current.clientWidth) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      setTimeout(checkScroll, 350);
    }
  };

  const topActiveTab = activeTab.startsWith("day-") ? "days" : activeTab;

  return (
    <div style={{ width: "100%", padding: "0 0.5rem" }}>
      {/* Top 3-Tabs Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.5rem",
          paddingBottom: "0.5rem",
          marginBottom: "0.5rem",
          alignItems: "center",
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {hasPrebooking && (
            <button
              className="tab-btn"
              onClick={() => setActiveTab("prebooking")}
              style={{
                padding: "0.4rem 1.25rem",
                background:
                  topActiveTab === "prebooking"
                    ? "var(--accent-primary)"
                    : "var(--bg-secondary)",
                border:
                  topActiveTab === "prebooking"
                    ? "none"
                    : "1px solid var(--border-light)",
                margin: 0,
                color:
                  topActiveTab === "prebooking"
                    ? "#fff"
                    : "var(--text-primary)",
                fontSize: "0.9rem",
                boxShadow: "var(--shadow-md)",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Prebooking
            </button>
          )}
          <button
            className="tab-btn"
            onClick={() => setActiveTab("day-0")}
            style={{
              padding: "0.4rem 1.25rem",
              background:
                topActiveTab === "days"
                  ? "var(--accent-primary)"
                  : "var(--bg-secondary)",
              border:
                topActiveTab === "days"
                  ? "none"
                  : "1px solid var(--border-light)",
              margin: 0,
              color: topActiveTab === "days" ? "#fff" : "var(--text-primary)",
              fontSize: "0.9rem",
              boxShadow: "var(--shadow-md)",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Plan
          </button>
          <button
            className={`tab-btn ${isEditing ? "disabled" : ""}`}
            onClick={() => !isEditing && setActiveTab("budget")}
            disabled={isEditing}
            title={isEditing ? "Budget view is disabled during editing" : ""}
            style={{
              padding: "0.4rem 1.25rem",
              background:
                topActiveTab === "budget"
                  ? "var(--accent-primary)"
                  : "var(--bg-secondary)",
              border:
                topActiveTab === "budget"
                  ? "none"
                  : "1px solid var(--border-light)",
              margin: 0,
              color: topActiveTab === "budget" ? "#fff" : "var(--text-primary)",
              fontSize: "0.9rem",
              boxShadow: "var(--shadow-md)",
              borderRadius: "6px",
              cursor: isEditing ? "not-allowed" : "pointer",
              opacity: isEditing ? 0.5 : 1,
            }}
          >
            Budget
          </button>
        </div>

        {/* Scroll Chevrons - Only show for Daily Plan selection if days count > 1 */}
        {topActiveTab === "days" && days && days.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              opacity: showLeft || showRight ? 1 : 0,
              pointerEvents: showLeft || showRight ? "auto" : "none",
              marginLeft: "auto",
            }}
          >
            <button
              onClick={() => showLeft && scroll("left")}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: showLeft ? "pointer" : "default",
                boxShadow: "var(--shadow-md)",
                opacity: showLeft ? 1 : 0.3,
              }}
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={() => showRight && scroll("right")}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: showRight ? "pointer" : "default",
                boxShadow: "var(--shadow-md)",
                opacity: showRight ? 1 : 0.3,
              }}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      {/* Sub-Days Row - Only render when Daily Plan is active and days count > 1 */}
      {topActiveTab === "days" && days && days.length > 1 && (
        <div
          className="tabs-container"
          ref={scrollRef}
          onScroll={checkScroll}
          style={{ marginTop: "0.25rem" }}
        >
          {days.map((dayObj, index) => (
            <button
              key={index}
              className={`tab-btn ${activeTab === `day-${index}` ? "active" : ""}`}
              onClick={(e) => handleTabClick(index, e)}
            >
              {dayObj.day && dayObj.day.length < 8
                ? dayObj.day
                : `Day ${index + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tabs;
