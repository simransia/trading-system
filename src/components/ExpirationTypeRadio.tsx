interface ExpirationTypeRadioProps {
  selectedExpiration: string;
  setSelectedExpiration: (type: string) => void;
}

export const ExpirationTypeRadio = ({
  selectedExpiration,
  setSelectedExpiration,
}: ExpirationTypeRadioProps) => (
  <>
    <div>
      <input
        type="radio"
        value="duration"
        checked={selectedExpiration === "duration"}
        onChange={() => setSelectedExpiration("duration")}
      />
      <span className="ml-2">Duration</span>
    </div>
    <div>
      <input
        type="radio"
        value="datetime"
        checked={selectedExpiration === "datetime"}
        onChange={() => setSelectedExpiration("datetime")}
      />
      <span className="ml-2">Specific Date & Time</span>
    </div>
  </>
);
