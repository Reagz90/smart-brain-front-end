import "./App.css";
import Navigation from "./components/Navigation/Navigation";
import FaceRecognition from "./components/FaceRecognition/FaceRecognition";
import Logo from "./components/Logo/Logo";
import ImageLinkForm from "./components/ImageLinkForm/ImageLinkForm";
import Rank from "./components/Rank/Rank";
import SignIn from "./components/SignIn/SignIn";
import Register from "./components/Register/Register";
import ParticlesBg from "particles-bg";
import React, { useState } from "react";

function App() {
  const [imageUrl, setImageUrl] = useState("");
  const [input, setInput] = useState("");
  const [box, setBox] = useState({});
  const [route, setRoute] = useState("signIn");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    entries: 0,
    joined: "",
  });

  const loadUser = (data) => {
    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined,
    });
  };

  //Personal access token for Clarifai API
  const PAT = "876f3f1773944f1da373eb31e465b2fb";

  const calculateFaceLocation = (data) => {
    const clarifaiFace =
      data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById("inputImage");
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - clarifaiFace.right_col * width,
      bottomRow: height - clarifaiFace.bottom_row * height,
    };
  };

  const displayFaceBox = (box) => {
    console.log("Box object: ", box);
    setBox(box);
  };

  const onInputChange = (event) => {
    setInput(event.target.value);
  };

  const onButtonSubmit = () => {
    setImageUrl(input);

    const IMAGE_URL = input;

    const raw = JSON.stringify({
      user_app_id: {
        user_id: "clarifai",
        app_id: "main",
      },
      inputs: [
        {
          data: {
            image: {
              url: IMAGE_URL,
            },
          },
        },
      ],
    });

    const requestOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "x-clarifai-request-id-prefix": "webportal",
        Authorization: "Key " + PAT,
      },
      body: raw,
    };

    // NOTE: MODEL_VERSION_ID is optional, you can also call prediction with the MODEL_ID only
    // https://api.clarifai.com/v2/models/{YOUR_MODEL_ID}/outputs
    // this will default to the latest version_id

    fetch(
      `https://api.clarifai.com/v2/models/face-detection/versions/6dc7e46bc9124c5c8824be4822abe105/outputs`,
      requestOptions
    )
      .then((response) => response.json()) // Parse the response from the Clarifai API call
      .then((data) => {
        // Call calculateFaceLocation with the Clarifai API response
        displayFaceBox(calculateFaceLocation(data));
        const boundingBox =
          data.outputs[0]?.data?.regions[0]?.region_info?.bounding_box;
        if (boundingBox) {
          console.log(boundingBox);
        } else {
          console.log("Bounding box not found in the response");
        }

        // After processing the Clarifai API response, make the PUT request
        if (data) {
          // Check if the response is successful
          return fetch("http://localhost:3000/image", {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json", // Add the Content-Type header for JSON data
            },
            body: JSON.stringify({
              id: user.id,
            }),
          });
        } else {
          // Handle unsuccessful response, if needed
          console.log("Response not successful");
          console.log('USER ID--->', user.id)
          throw new Error("Response not successful");
        }
      })
      .then((response) => response.json()) // Parse the response from the PUT request
      .then((count) => {
        // Process the response from the PUT request, if needed
        // Update the 'user' state with the updated 'entries' value
        setUser((prevState) => ({
          ...prevState,
          entries: count, 
        }));
      })
      .catch((error) => console.log("Error:", error));
  };

  const onRouteChange = (route) => {
    if (route === "signout") {
      setIsSignedIn(false);
    } else if (route === "home") {
      setIsSignedIn(true);
    }
    setRoute(route);
  };

  return (
    <div className="App">
      <ParticlesBg type="cobweb" bg={true} />
      <Navigation isSignedIn={isSignedIn} onRouteChange={onRouteChange} />
      {route === "home" ? (
        <div>
          <Logo />
          <Rank name={user.name} entries={user.entries} />
          <ImageLinkForm
            onInputChange={onInputChange}
            onButtonSubmit={onButtonSubmit}
          />
          <FaceRecognition box={box} imageUrl={imageUrl} />
        </div>
      ) : route === "signIn" ? (
        <SignIn onRouteChange={onRouteChange} loadUser={loadUser} />
      ) : (
        <Register onRouteChange={onRouteChange} loadUser={loadUser} />
      )}
    </div>
  );
}

export default App;
