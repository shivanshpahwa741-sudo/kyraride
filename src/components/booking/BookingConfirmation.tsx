import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Clock, CreditCard, Route, Sparkles, Download, Share2, Loader2, Image } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { FareDetails, WeekDay } from "@/types/booking";
import type { BookingSchemaType } from "@/schemas/booking-schema";

interface BookingConfirmationProps {
  bookingData: BookingSchemaType;
  fareDetails: FareDetails;
  distanceKm: number;
  paymentId: string;
  subscriptionStartDate: string;
  onBookAnother: () => void;
}

export function BookingConfirmation({
  bookingData,
  fareDetails,
  distanceKm,
  paymentId,
  subscriptionStartDate,
  onBookAnother,
}: BookingConfirmationProps) {
  const confirmationRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDays = (days: WeekDay[]) => {
    return days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ");
  };

  // Calculate dates for each selected day
  const getScheduledDates = () => {
    const dayMap: Record<WeekDay, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const startDateMatch = subscriptionStartDate.match(/(\d+)\s+(\w+)\s+(\d+)/);
    if (!startDateMatch) return [];

    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
    const day = parseInt(startDateMatch[1]);
    const month = monthNames.indexOf(startDateMatch[2]);
    const year = parseInt(startDateMatch[3]);

    const startDate = new Date(year, month, day);

    return bookingData.selectedDays.map((weekDay) => {
      const targetDayNum = dayMap[weekDay];
      const mondayNum = 1;
      const daysToAdd = (targetDayNum - mondayNum + 7) % 7;
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + daysToAdd);
      
      return {
        day: weekDay,
        date: date.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      };
    });
  };

  const scheduledDates = getScheduledDates();

  // Generate canvas from the confirmation card
  const generateCanvas = async () => {
    if (!confirmationRef.current) return null;
    
    const canvas = await html2canvas(confirmationRef.current, {
      backgroundColor: "#1a0a0c", // Match dark background
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
    });
    
    return canvas;
  };

  // Download as PDF
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Could not generate image");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add header
      pdf.setFillColor(86, 28, 36); // Brand burgundy
      pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text("KYRA Ride Confirmation", pdfWidth / 2, 13, { align: "center" });

      // Add the confirmation image
      pdf.addImage(imgData, "PNG", 10, 25, pdfWidth - 20, pdfHeight * 0.8);

      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, 10, pdf.internal.pageSize.getHeight() - 10);

      pdf.save(`kyra-booking-${paymentId}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // Download as Image
  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Could not generate image");

      const link = document.createElement("a");
      link.download = `kyra-booking-${paymentId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Image download error:", error);
      toast.error("Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  };

  // Share confirmation
  const handleShare = async () => {
    setIsSharing(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Could not generate image");

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not create blob"));
        }, "image/png");
      });

      const file = new File([blob], `kyra-booking-${paymentId}.png`, { type: "image/png" });

      // Check if Web Share API is available with file sharing
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "KYRA Ride Confirmation",
          text: `My KYRA ride subscription is confirmed! Payment ID: ${paymentId}`,
          files: [file],
        });
        toast.success("Shared successfully!");
      } else if (navigator.share) {
        // Fallback to text-only share
        await navigator.share({
          title: "KYRA Ride Confirmation",
          text: `My KYRA ride subscription is confirmed!\n\nPickup: ${bookingData.pickupAddress}\nDrop: ${bookingData.dropAddress}\nDays: ${formatDays(bookingData.selectedDays)}\nAmount: ₹${fareDetails.totalWeeklyFare}\nPayment ID: ${paymentId}`,
        });
        toast.success("Shared successfully!");
      } else {
        // Fallback: copy to clipboard
        const shareText = `KYRA Ride Confirmation\n\nPickup: ${bookingData.pickupAddress}\nDrop: ${bookingData.dropAddress}\nDays: ${formatDays(bookingData.selectedDays)}\nTime: ${formatTime(bookingData.pickupTime)}\nAmount: ₹${fareDetails.totalWeeklyFare}\nPayment ID: ${paymentId}`;
        await navigator.clipboard.writeText(shareText);
        toast.success("Booking details copied to clipboard!");
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
        toast.error("Failed to share");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent/30 to-accent/10 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500">
          <CheckCircle className="w-10 h-10 text-accent" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Thank You! 🎉
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Your KYRA ride subscription is confirmed. We're excited to have you on board!
          </p>
        </div>
      </div>

      {/* Download/Share Actions */}
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          variant="outline"
          size="sm"
          className="border-accent/30 hover:bg-accent/10 text-foreground"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download PDF
        </Button>
        <Button
          onClick={handleDownloadImage}
          disabled={isDownloading}
          variant="outline"
          size="sm"
          className="border-accent/30 hover:bg-accent/10 text-foreground"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Image className="h-4 w-4 mr-2" />
          )}
          Download Image
        </Button>
        <Button
          onClick={handleShare}
          disabled={isSharing}
          variant="outline"
          size="sm"
          className="border-accent/30 hover:bg-accent/10 text-foreground"
        >
          {isSharing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4 mr-2" />
          )}
          Share
        </Button>
      </div>

      {/* Confirmation Card - this is what gets captured */}
      <div ref={confirmationRef} className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 space-y-5">
        {/* Payment Success Badge */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-accent">Payment Successful</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
            {paymentId}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Route Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Route className="h-4 w-4 text-accent" />
            Your Route
          </h3>
          <div className="space-y-2 pl-6">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm text-foreground">{bookingData.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Drop</p>
                <p className="text-sm text-foreground">{bookingData.dropAddress}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Distance: <span className="text-foreground font-medium">{distanceKm.toFixed(1)} km</span> (one way)
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Schedule Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            Subscription Schedule
          </h3>
          <div className="space-y-2 pl-6">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Pickup Time:</span>
              <span className="text-foreground font-medium">{formatTime(bookingData.pickupTime)}</span>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground mb-2">
                Starting from <span className="text-foreground font-medium">{subscriptionStartDate}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {scheduledDates.map(({ day, date }) => (
                  <div
                    key={day}
                    className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5 text-xs"
                  >
                    <span className="text-foreground font-medium capitalize">{day}</span>
                    <span className="text-muted-foreground ml-1">• {date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Payment Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            Payment Summary
          </h3>
          <div className="pl-6">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold">Amount Paid</span>
              <span className="text-xl font-bold text-accent">₹{fareDetails.totalWeeklyFare}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Weekly subscription • {fareDetails.numberOfDays} rides
            </p>
          </div>
        </div>

        {/* KYRA Branding for exported image */}
        <div className="border-t border-border/30 pt-3 text-center">
          <p className="text-xs text-muted-foreground">
            KYRA • Women's Auto Service for Bangalore
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Our driver will reach your pickup location at{" "}
          <span className="text-foreground font-medium">{formatTime(bookingData.pickupTime)}</span> on scheduled days.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          For any queries, please contact us on WhatsApp.
        </p>
      </div>

      {/* Book Another Button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={onBookAnother}
          variant="outline"
          className="border-accent/30 hover:bg-accent/10 text-foreground"
        >
          Book Another Subscription
        </Button>
      </div>
    </div>
  );
}
