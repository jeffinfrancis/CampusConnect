import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["registered", "waitlisted", "cancelled"],
      default: "registered",
    },
    attendanceStatus: {
      type: String,
      enum: ["not-marked", "attended", "absent"],
      default: "not-marked",
    },
  },
  { timestamps: true }
);

// One registration record per student per event
registrationSchema.index({ student: 1, event: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);

export default Registration;