import react from "react";
import NavBar from "../../Components/NavBar/NavBar";


function HomePage() {

    return (
        <div>
            <div>
                <NavBar />
            </div>
            <div> <h1>Welcome to the Home Page</h1>
        <p>This is the main page of our application.</p></div>
        </div>
      
    );
};

export default HomePage;