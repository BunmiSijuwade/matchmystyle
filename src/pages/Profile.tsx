import { useState } from "react";
import { Ruler, Save, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import GradientButton from "@/components/GradientButton";

interface Measurements {
  height: string;
  heightUnit: "cm" | "ft";
  size: string;
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
    size: "",
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 max-w-2xl">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 glass-light rounded-full px-4 py-2 mb-4 text-sm font-medium text-primary">
            <Ruler className="w-4 h-4" />
            <span>Your Style Profile</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            My{" "}
            <span className="text-gradient italic">Measurements</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Enter your measurements once and get perfectly-sized outfit matches every time.
          </p>
        </div>

        <div className="glass rounded-2xl p-5 sm:p-8 space-y-8">
          {/* Height */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-foreground">Height</h3>
            <div className="flex gap-3">
              <input
                type="number"
                value={measurements.height}
                onChange={(e) => update("height", e.target.value)}
                placeholder={measurements.heightUnit === "cm" ? "e.g. 165" : "e.g. 5.5"}
                className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 min-h-[44px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-300"
              />
              <div className="flex rounded-xl overflow-hidden border border-border">
                {(["cm", "ft"] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => update("heightUnit", unit)}
                    className={`px-5 py-3 text-sm font-medium transition-all duration-300 ease-out min-h-[44px] ${
                      measurements.heightUnit === unit
                        ? "gradient-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clothing Size */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-foreground">Clothing Size</h3>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  onClick={() => update("size", size)}
                  className={`w-14 h-12 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-300 ease-out border ${
                    measurements.size === size
                      ? "gradient-primary text-primary-foreground border-transparent shadow-brand"
                      : "border-border text-muted-foreground hover:border-primary hover:text-foreground bg-muted"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Body Measurements */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-2 text-foreground">
              Body Measurements{" "}
              <span className="text-muted-foreground text-sm font-sans font-normal">(optional, in cm)</span>
            </h3>
            <p className="text-muted-foreground text-sm mb-4">For more precise matching, especially for tops and dresses.</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { field: "bust" as const, label: "Bust", placeholder: "e.g. 88" },
                { field: "waist" as const, label: "Waist", placeholder: "e.g. 70" },
                { field: "hips" as const, label: "Hips", placeholder: "e.g. 96" },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">{label}</label>
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

          {/* Shoe Size */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-foreground">Shoe Size (EU)</h3>
            <input
              type="number"
              value={measurements.shoeSize}
              onChange={(e) => update("shoeSize", e.target.value)}
              placeholder="e.g. 38"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 min-h-[44px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-300"
            />
          </div>

          {/* Currency */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-foreground">Preferred Currency</h3>
            <div className="flex gap-2">
              {["USD", "EUR", "GBP", "CAD"].map((currency) => (
                <button
                  key={currency}
                  onClick={() => update("preferredCurrency", currency)}
                  className={`px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-300 ease-out border ${
                    measurements.preferredCurrency === currency
                      ? "gradient-primary text-primary-foreground border-transparent shadow-brand"
                      : "border-border text-muted-foreground hover:border-primary bg-muted"
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
