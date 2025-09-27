import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { FaArrowUp } from "react-icons/fa";

const ScrollToTopButton: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            {isVisible && (
                <Button
                    variant="primary"
                    onClick={scrollToTop}
                    className="rounded-circle shadow"
                    style={{ position: "fixed", bottom: "20px", right: "20px", width: "45px", height: "45px" }}>
                    <FaArrowUp />
                </Button>
            )}
        </>
    );
};

export default ScrollToTopButton;
