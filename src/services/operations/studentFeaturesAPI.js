import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";
import axios from "axios";

const {COURSE_PAYMENT_API, COURSE_VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API} = studentEndpoints;

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;

        script.onload = () => {
            resolve(true);
        }
        script.onerror= () =>{
            resolve(false);
        }
        document.body.appendChild(script);
    })
}


export async function buyCourse(token, courses, userDetails, navigate, dispatch) {
    const toastId = toast.loading("Loading...");
    try{
        //load the script
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
        console.log("Razorpay Script Loaded:", res);
        //console.log("Razorpay Key:", import.meta.env.RAZORPAY_KEY);
        if(!res) {
            toast.error("RazorPay SDK failed to load");
            return;
        }
        
        //initiate the order
        const orderResponse = await apiConnector("POST", COURSE_PAYMENT_API, 
                                {courses},
                                {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                });
        console.log("Order Response:", orderResponse);
        if(!orderResponse.data.success) {
            throw new Error(orderResponse?.data.message);
        }
        
        //options
        const options = {
            key: "rzp_test_M7I1p9KEo7w117",
            currency: orderResponse.data.data.currency,
            amount: Number(orderResponse.data.data.amount),
            order_id: orderResponse.data.data.id,
            name: "StudyVault",
            description: "Thank You for Purchasing the Course",
            image: rzpLogo,
            prefill: {
                name: `${userDetails.firstName}`,
                email: userDetails.email
            },
            handler: function(response) {
                console.log("Razorpay payment response:", response);
                
                // Ensure we have the payment ID
                if (!response.razorpay_payment_id) {
                    toast.error("Payment ID is missing");
                    return;
                }
                
                //send successful wala mail
                sendPaymentSuccessEmail(response, orderResponse.data.data.amount, token);
                
                //verifyPayment with the payment ID and courses
                verifyPayment({
                    razorpay_payment_id: response.razorpay_payment_id,
                    courses: courses
                }, token, navigate, dispatch);
            }
        }
        
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        paymentObject.on("payment.failed", function(response) {
            toast.error("Oops, payment failed");
            console.log("Payment failed:", response.error);
        })

    }
    catch(error) {
        console.log("PAYMENT API ERROR.....", error);
        toast.error("Could not make Payment");
    }
    toast.dismiss(toastId);
}

async function sendPaymentSuccessEmail(response, amount, token) {
    try{
        await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            amount,
        },{
            Authorization: `Bearer ${token}`
        })
    }
    catch(error) {
        console.log("PAYMENT SUCCESS EMAIL ERROR....", error);
    }
}

//verify payment
export const verifyPayment = async (paymentData, token, navigate, dispatch) => {
    const toastId = toast.loading("Verifying Payment....");
    dispatch(setPaymentLoading(true));
    try {
        // Ensure we have the necessary data
        if (!paymentData.razorpay_payment_id) {
            throw new Error("Payment ID is missing");
        }
        
        console.log("Sending payment verification request:", {
            paymentId: paymentData.razorpay_payment_id,
            courses: paymentData.courses
        });
        
        const response = await axios.post(
            COURSE_VERIFY_API,
            paymentData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            }
        )
        
        console.log("Payment verification response:", response.data);
        
        if (!response.data.success) {
            throw new Error(response.data.message || "Payment verification failed")
        }
        
        toast.success("Payment Successful, you are added to the course");
        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
        return response.data
    } catch (error) {
        console.error("PAYMENT VERIFY ERROR....", error)
        console.error("Error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        toast.error(error.response?.data?.message || "Could not verify Payment")
    } finally {
        toast.dismiss(toastId);
        dispatch(setPaymentLoading(false));
    }
}