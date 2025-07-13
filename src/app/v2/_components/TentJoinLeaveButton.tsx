import React from "react";

const TentJoinLeaveButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  return (
    <button
      {...props}
      onMouseEnter={(e) => {
        e.currentTarget.classList.add("v2-tent-btn-hover");
        if (props.onMouseEnter) {
          props.onMouseEnter(e);
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.classList.remove("v2-tent-btn-hover");
        if (props.onMouseLeave) {
          props.onMouseLeave(e);
        }
      }}
    />
  );
};

export default TentJoinLeaveButton; 