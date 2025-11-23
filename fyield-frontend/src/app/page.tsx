import Image from "next/image";
import Hero from "./components/Hero";

export default function Home() {
  return (
    <div className="">
        <Hero/>
        <div className="absolute bottom-0 left-0 mb-4 ml-4 text-sm text-gray-500">
          <span><b>Built</b> with ❤️ by Rehan & Ali</span>
        </div>
        <div className="absolute bottom-0 right-0 mb-4 mr-4 text-sm text-gray-500">
          <span><b>Powered</b> by
            <img
                  src="https://wp.logos-download.com/wp-content/uploads/2024/09/Flare_FLR_Logo_full.png"
                  alt="icon"
                  className="inline-block w-12 h-4 ml-1 mb-1"
              />
          </span>
        </div>
    </div>
  );
}
