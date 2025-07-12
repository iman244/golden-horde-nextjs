"use client";
import { useHordesQuery } from "../hooks/useHordesQuery";
import Tent from "./_components/Tent";

const V2Page = () => {
  const hordes_q = useHordesQuery();

  return (
    <div className="v2-page-bg">
      <div className="v2-content">
        <div className="mb-8">
          {(hordes_q.data?.data || []).map((horde) => (
            <div key={horde.id} className="v2-card">
              <h3 className="v2-card-title">
                🏰 {horde.name}
              </h3>
              <div className="v2-tent-list">
                {horde.tents.map((tent) => (
                  <Tent key={tent.id} tent={tent} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default V2Page;
