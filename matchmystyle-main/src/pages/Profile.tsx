import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";

interface Measurements {
  height: string;
  heightUnit: "cm" | "ft";
  size: string[];
  bust: string;
  waist: string;
  hips: string;
  shoeSize: string;
  preferredCurrency: string;
}

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"];

const Profile = () => {
  const [measurements, setMeasurements] = useState<Measurements>({
    height: "",
    heightUnit: "cm",
    size: [],
    bust: "",
    waist: "",
    hips: "",
    shoeSize: "",
    preferredCurrency: "USD",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("matchmystyle_profile", JSON.stringify(measurements));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = (field: keyof Measurements, value: string) => {
    setMeasurements((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSize = (size: string) => {
    setMeasurements((prev) => ({
      ...prev,
      size: prev.size.includes(size)
        ? prev.size.filter((s) => s !== size)
        : [...prev.size, size],
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-[10px] font-medium tracking-[1px] uppercase text-muted-foreground mb-4">Your Style Profile</p>
          <h1 className="text-3xl sm:text-4xl font-light mb-3 tracking-[-1.2px]">
            My{" "}
            <span className="text-gradient italic font-normal">Measurements</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-[1.7]">
            Enter your measurements once and get perfectly-sized outfit matches every time.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 space-y-8">
          {/* Height */}
          <div>
            <h3 className="text-base font-medium mb-4 text-foreground tracking-[-0.3px]">Height</h3>
            <div className="flex gap-3">
              <input
                type="number"
                value={measurements.height}
                onChange={(e) => update("height", e.target.value)}
                placeholder={measurements.heightUnit === "cm" ? "e.g. 165" : "e.g. 5.5"}
                className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 min-h-[44px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-300 text-sm"
              />
              <div className="flex rounded-full overflow-hidden border border-border bg-muted">
                {(["cm", "ft"] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => update("heightUnit", unit)}
                    className={`px-5 py-3 text-[11px] font-medium tracking-[1px] uppercase transition-all duration-300 ease-out min-h-[44px] ${
                      measurements.heightUnit === unit
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-border" />

          {/* Clothing Size */}
          <div>
            <h3 className="text-base font-medium mb-4 text-foreground tracking-[-0.3px]">Clothing Size</h3>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`w-14 h-12 min-h-[44px] rounded-full text-[11px] font-medium tracking-[0.5px] transition-all duration-300 ease-out border ${
                    measurements.size.includes(size)
                      ? "bg-foreground text-background border-transparent"
                      : "border-border text-muted-foreground hover:border-primary hover:text-foreground bg-card"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-border" />

          {/* Body Measurements */}
          <div>
            <h3 className="text-base font-medium mb-2 text-foreground tracking-[-0.3px]">
              Body Measurements{" "}
              <span className="text-muted-foreground text-xs font-normal">(optional, in cm)</span>
            </h3>
            <p className="text-muted-foreground text-sm mb-4">For more precise matching, especially for tops and dresses.</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { field: "bust" as const, label: "Bust", placeholder: "e.g. 88" },
                { field: "waist" as const, label: "Waist", placeholder: "e.g. 70" },
                { field: "hips" as const, label: "Hips", placeholder: "e.g. 96" },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-[1px] mb-2 block font-medium">{label}</label>
                  <input
                    type="number"
                    value={measurements[field]}
                    onChange={(e) => update(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-3 min-h-[44px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-300 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-border" />

          {/* Shoe Size */}
          <div>
            <h3 className="text-base font-medium mb-4 text-foreground tracking-[-0.3px]">Shoe Size (EU)</h3>
            <input
              type="number"
              value={measurements.shoeSize}
              onChange={(e) => update("shoeSize", e.target.value)}
              placeholder="e.g. 38"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 min-h-[44px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-300 text-sm"
            />
          </div>

          <div className="w-full h-px bg-border" />

          {/* Currency */}
          <div>
            <h3 className="text-base font-medium mb-4 text-foreground tracking-[-0.3px]">Preferred Currency</h3>
            <div className="flex gap-2">
              {["USD", "EUR", "GBP", "CAD"].map((currency) => (
                <button
                  key={currency}
                  onClick={() => update("preferredCurrency", currency)}
                  className={`px-5 py-2.5 min-h-[44px] rounded-full text-[11px] font-medium tracking-[1px] uppercase transition-all duration-300 ease-out border ${
                    measurements.preferredCurrency === currency
                      ? "bg-foreground text-background border-transparent"
                      : "border-border text-muted-foreground hover:border-primary bg-card"
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <GradientButton onClick={handleSave} size="lg" className="w-full">
              {saved ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Profile Saved!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save My Profile
                </>
              )}
            </GradientButton>
            {saved && (
              <p className="text-center text-sm text-primary mt-3">
                ✓ Your measurements are saved and will be used for outfit matching
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
