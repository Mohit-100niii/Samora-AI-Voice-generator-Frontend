import React, { useEffect, useRef, useState } from "react";
import { Cone, Download, SwatchBook, Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";

export default function App() {
  const [audioSrc, setAudioSrc] = useState(null);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [userAudios, setUserAudios] = useState(0);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  console.log(process.env.REACT_APP_CLOUDINARY_UPLOAD_URL); // Check if the URL is correct


  const handleSearch = async (e) => {
    e.preventDefault();

    if (!isSignedIn) {
      Swal.fire({
        icon: "warning",
        title: "Please Login",
        text: "You need to log in to generate audio.",
      });
      return;
    }

    if (!inputText) {
      Swal.fire({
        icon: "warning",
        text: "Please Enter Some text to generate Audio",
      });
    } else if (wordCount > 250) {
      Swal.fire({
        icon: "warning",
        text: "Please Enter less than 250 letters",
      });
    } else {
      setIsLoading(true);
      Swal.fire({
        title: "Generating Audio",
        html: "<div class='loader'></div><p>Please wait while your audio is being generated...</p>",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

   
      try {
        const response = await axios.post(
          "http://localhost:5000/api/text-to-speech",
          {
            text: inputText,
          },
          {
            responseType: "blob",
          }
        );

        const audioUrl = URL.createObjectURL(response.data);
        setAudioSrc(audioUrl);
        if (audioRef.current) {
          audioRef.current.load();
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 403) {
            Swal.fire({
              icon: "error",
              text: "Run out of Credentials, please try again in a few days.",
            });
          } else {
            // Generic error message
            Swal.fire({
              icon: "error",
              text: "An unexpected error occurred. Please try again.",
            });
          }
        } else {
          // Handle error when no response is received
          Swal.fire({
            icon: "error",
            text: "Network error. Please try again later.",
          });
        }
        console.error(error);
      } finally {
        setIsLoading(false);
        Swal.close();
      }
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    if (text.trim() === "") {
      setAudioSrc(null);
    }
    const letterCount = text.replace(/\s+/g, "").length;
    setWordCount(letterCount);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      const maxFileSize = 10 * 1024 * 1024; // 10 MB in bytes
      if (file.size > maxFileSize) {
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: "The file is too large. Please upload a file smaller than 10 MB.",
        });
        event.target.value = ""; // Reset the input field to allow re-upload
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setInputText(content);
        const letterCount = content.replace(/\s+/g, "").length;
        setWordCount(letterCount);
      };
      reader.readAsText(file);
    }
    event.target.value = ""; // Reset the input field to allow re-upload
  };

  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  const { isSignedIn, userId, isLoading: clerkLoading } = useAuth();
  const { user } = useUser();

  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim(); // Combine first and last name
  const email = user?.primaryEmailAddress?.emailAddress;

  const saveAudioToDatabase = async (audiourl, inputText) => {
    try {
      Swal.fire({
        title: "Saving Audio...",
        text: "Please wait while your audio is being saved.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      console.log("Function Called");
      console.log(inputText, audiourl, name, email);

      // Convert Blob URL to a Blob object
      const response = await fetch(audiourl);
      const blob = await response.blob();

      // Convert Blob to File
      const file = new File([blob], "audio.wav", { type: blob.type });

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "raw_audio_preset"); // Replace with your Cloudinary upload preset

      const cloudinaryResponse = await fetch(
        // "https://api.cloudinary.com/v1_1/dolpjmmbz/raw/upload",
        process.env.REACT_APP_CLOUDINARY_UPLOAD_URL, // Replace with your Cloudinary endpoint
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error("Failed to upload audio to Cloudinary");
      }

      const cloudinaryData = await cloudinaryResponse.json();
      const cloudinaryUrl = cloudinaryData.secure_url; // The public URL of the uploaded audio
      console.log(cloudinaryUrl);

      // Save audio URL and inputText to your backend
      const data = await axios.post(
        "http://localhost:5000/api/savedaudio",
        // "https://ai-voice-generator-backend.onrender.com/api/savedaudio",
        {
          inputText,
          audiourl: cloudinaryUrl,
          fullname: name,
          email,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      Swal.fire({
        icon: "success",
        text: "Audio is Saved Sucessfully",
      });

      console.log(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        text: "Please Try again After Sometime",
      });
      console.error("Error saving audio to database:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-6 md:py-24 lg:py-10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your Words, Our Voice — Powered by AI!
                </h1>
                <p>
                  From captivating narrations to professional voiceovers, bring
                  your ideas to life in seconds!
                </p>
              </div>

              <div className="w-full max-w-3xl space-y-4">
                <form
                  className="flex flex-col space-y-2"
                  onSubmit={handleSearch}
                >
                  <Textarea
                    className="min-h-[180px] p-4 text-base border-2 bg-gray-100 border-gray-200 font-sans"
                    placeholder="Enter text to generate audio"
                    value={inputText}
                    onChange={handleInputChange}
                  />
                  <div className="text-right text-gray-500 text-sm">
                    Letter Count: {wordCount}
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    <div className="text-base">Generate Audio</div>
                  </Button>
                </form>

                <div className="flex justify-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.md,.csv"
                  />
                  <Button
                    onClick={triggerFileUpload}
                    variant="outline"
                    className="w-full max-w-xs"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </div>

              <div className="w-full max-w-sm mt-8">
                {audioSrc ? (
                  <div className="space-y-4">
                    <audio controls ref={audioRef} className="w-full">
                      <source src={audioSrc} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    <Button
                      className="w-full"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = audioSrc; // The audio source URL
                        link.download = "output_audio.mp3"; // The name of the downloaded file
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Audio
                    </Button>
                    <Button
                      onClick={() => saveAudioToDatabase(audioSrc, inputText)}
                      disabled={isLoading}
                    >
                      Save Audio to My Account
                    </Button>
                  </div>
                ) : (
                  <div className="h-[100px] flex items-center justify-center text-gray-400">
                    No audio file generated yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
