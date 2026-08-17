"use client";

import { toast } from "./shadcnui/toast";
import { Button } from "./shadcnui/button";

const ToastButton = () => {
  return (
    <Button
      variant="outline"
      onClick={() => {
        toast.add({
          title: "BidFly Enterprise",
          description: "Fullstack Next.js Suite Initialized Successfully.",
          type: "success",
        });
      }}
      className="cursor-pointer">
      Test Toast Notification
    </Button>
  );
};

export default ToastButton;
