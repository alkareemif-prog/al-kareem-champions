export type Division = {
  name: string;
  districts: { name: string; upazilas: string[] }[];
};

export const DIVISIONS: Division[] = [
  {
    name: "Dhaka",
    districts: [
      { name: "Dhaka", upazilas: ["Savar", "Dhamrai", "Keraniganj", "Nawabganj"] },
      { name: "Gazipur", upazilas: ["Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur"] },
      { name: "Narayanganj", upazilas: ["Sonargaon", "Rupganj", "Araihazar", "Bandar"] },
      { name: "Tangail", upazilas: ["Tangail Sadar", "Mirzapur", "Ghatail", "Kalihati"] },
    ],
  },
  {
    name: "Chattogram",
    districts: [
      { name: "Chattogram", upazilas: ["Hathazari", "Sitakunda", "Patiya", "Anwara"] },
      { name: "Cumilla", upazilas: ["Cumilla Sadar", "Laksam", "Chauddagram", "Debidwar"] },
      { name: "Cox's Bazar", upazilas: ["Cox's Bazar Sadar", "Chakaria", "Ramu", "Teknaf"] },
    ],
  },
  {
    name: "Rajshahi",
    districts: [
      { name: "Rajshahi", upazilas: ["Paba", "Bagmara", "Durgapur", "Charghat"] },
      { name: "Bogura", upazilas: ["Bogura Sadar", "Sherpur", "Shibganj", "Adamdighi"] },
      { name: "Pabna", upazilas: ["Pabna Sadar", "Ishwardi", "Bera", "Sujanagar"] },
    ],
  },
  {
    name: "Khulna",
    districts: [
      { name: "Khulna", upazilas: ["Dumuria", "Batiaghata", "Rupsa", "Terokhada"] },
      { name: "Jashore", upazilas: ["Jashore Sadar", "Jhikargachha", "Keshabpur", "Abhaynagar"] },
    ],
  },
  {
    name: "Sylhet",
    districts: [
      { name: "Sylhet", upazilas: ["Sylhet Sadar", "Beanibazar", "Golapganj", "Jaintiapur"] },
      { name: "Moulvibazar", upazilas: ["Moulvibazar Sadar", "Sreemangal", "Kulaura", "Barlekha"] },
    ],
  },
  {
    name: "Barishal",
    districts: [
      { name: "Barishal", upazilas: ["Barishal Sadar", "Bakerganj", "Babuganj", "Gaurnadi"] },
      { name: "Patuakhali", upazilas: ["Patuakhali Sadar", "Kalapara", "Bauphal", "Galachipa"] },
    ],
  },
  {
    name: "Rangpur",
    districts: [
      { name: "Rangpur", upazilas: ["Rangpur Sadar", "Badarganj", "Mithapukur", "Pirganj"] },
      { name: "Dinajpur", upazilas: ["Dinajpur Sadar", "Birampur", "Parbatipur", "Phulbari"] },
    ],
  },
  {
    name: "Mymensingh",
    districts: [
      { name: "Mymensingh", upazilas: ["Mymensingh Sadar", "Trishal", "Bhaluka", "Muktagachha"] },
      { name: "Jamalpur", upazilas: ["Jamalpur Sadar", "Sarishabari", "Madarganj", "Islampur"] },
    ],
  },
];