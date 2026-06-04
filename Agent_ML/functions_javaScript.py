def getMyParcels_fxn():
    return {
        "status": "success",
        "data": [
            {
                "_id": "69d398da7cdc334aebd5ed7f",
                "parcelId": "P-BQ11DPIG7K",
                "category": "furniture",
                "product": "home furniture",
                "weight": 100,
                "receiverName": "gyan prakash",
                "receiverContact": "1231231231",
                "originCity": "110, Makki Masjid Main Rd, Bhangel, Goyal Colony, Salarpur Khadar, Noida, Uttar Pradesh 201304, India",
                "destinationCity": "Darbhanga, Bihar, India",
                "distanceKm": 1146.38,
                "deliveryPartner": "FedEx",
                "serviceType": "Standard",
                "cost": 18017.61,
                "currentStatus": "IN_TRANSIT",
                "expectedDeliveryDate": "2026-04-15T11:28:26.653Z",
                "deliveryDescription": "Status updated to IN_TRANSIT at noida. in packageing state",
                "isDelayed": False,
                "history": [
                    {
                        "status": "PLACED",
                        "currentLocation": "110, Makki Masjid Main Rd, Bhangel, Goyal Colony, Salarpur Khadar, Noida, Uttar Pradesh 201304, India",
                        "comment": "Parcel created via FedEx (Standard)",
                        "updatedBy": "69d36b17efb3d3c177ca762e",
                        "_id": "69d398da7cdc334aebd5ed80",
                        "updatedAt": "2026-04-06T11:28:26.654Z"
                    },
                    {
                        "status": "IN_TRANSIT",
                        "currentLocation": "noida",
                        "comment": "in packageing state",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-06T18:01:00.000Z",
                        "_id": "69d398fc7cdc334aebd5edbb"
                    }
                ],
                "createdBy": "69d36b17efb3d3c177ca762e",
                "vehicleType": "truck",
                "createdAt": "2026-04-06T11:28:26.655Z",
                "updatedAt": "2026-04-06T11:29:00.495Z",
                "__v": 1
            },
            {
                "_id": "69d394df7cdc334aebd5ec25",
                "parcelId": "P-MD50P6X9O3",
                "category": "clothing",
                "product": "snitch tshirts",
                "weight": 194,
                "receiverName": "deepanshu yadav",
                "receiverContact": "9992505628",
                "originCity": "798, Chinyot Colony, Rohtak, Haryana 124001, India",
                "destinationCity": "KM74, KM74, Block M, Sector 18, Kavi Nagar, Ghaziabad, Uttar Pradesh 201002, India",
                "distanceKm": 129.66,
                "deliveryPartner": "amazon logistics",
                "serviceType": "Express",
                "cost": 22332.12,
                "currentStatus": "DISPATCHED",
                "expectedDeliveryDate": "2026-04-12T11:11:27.528Z",
                "deliveryDescription": "Status updated to DISPATCHED at noida sector 42. in noida somewhere",
                "isDelayed": True,
                "history": [
                    {
                        "status": "PLACED",
                        "currentLocation": "798, Chinyot Colony, Rohtak, Haryana 124001, India",
                        "comment": "Parcel created via amazon logistics (Express)",
                        "updatedBy": "69d36b17efb3d3c177ca762e",
                        "_id": "69d394df7cdc334aebd5ec26",
                        "updatedAt": "2026-04-06T11:11:27.533Z"
                    },
                    {
                        "status": "IN_TRANSIT",
                        "currentLocation": "new delhi",
                        "comment": "in the ware house",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-07T16:42:00.000Z",
                        "_id": "69d396dc7cdc334aebd5eca7"
                    },
                    {
                        "status": "DISPATCHED",
                        "currentLocation": "noida sector 42",
                        "comment": "in noida somewhere",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-14T22:15:00.000Z",
                        "_id": "69d397b47cdc334aebd5ed18"
                    }
                ],
                "createdBy": "69d36b17efb3d3c177ca762e",
                "vehicleType": "truck",
                "createdAt": "2026-04-06T11:11:27.540Z",
                "updatedAt": "2026-04-06T11:23:32.627Z",
                "__v": 2
            }
        ]
    }

######################################################################################################
def getParcelById_fxn(id:str):
    return {
        "status": "success",
        "data": [
            {
                "_id": "69d398da7cdc334aebd5ed7f",
                "parcelId": "P-BQ11DPIG7K",
                "category": "furniture",
                "product": "home furniture",
                "weight": 100,
                "receiverName": "gyan prakash",
                "receiverContact": "1231231231",
                "originCity": "110, Makki Masjid Main Rd, Bhangel, Goyal Colony, Salarpur Khadar, Noida, Uttar Pradesh 201304, India",
                "destinationCity": "Darbhanga, Bihar, India",
                "distanceKm": 1146.38,
                "deliveryPartner": "FedEx",
                "serviceType": "Standard",
                "cost": 18017.61,
                "currentStatus": "IN_TRANSIT",
                "expectedDeliveryDate": "2026-04-15T11:28:26.653Z",
                "deliveryDescription": "Status updated to IN_TRANSIT at noida. in packageing state",
                "isDelayed": False,
                "history": [
                    {
                        "status": "PLACED",
                        "currentLocation": "110, Makki Masjid Main Rd, Bhangel, Goyal Colony, Salarpur Khadar, Noida, Uttar Pradesh 201304, India",
                        "comment": "Parcel created via FedEx (Standard)",
                        "updatedBy": "69d36b17efb3d3c177ca762e",
                        "_id": "69d398da7cdc334aebd5ed80",
                        "updatedAt": "2026-04-06T11:28:26.654Z"
                    },
                    {
                        "status": "IN_TRANSIT",
                        "currentLocation": "noida",
                        "comment": "in packageing state",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-06T18:01:00.000Z",
                        "_id": "69d398fc7cdc334aebd5edbb"
                    }
                ],
                "createdBy": "69d36b17efb3d3c177ca762e",
                "vehicleType": "truck",
                "createdAt": "2026-04-06T11:28:26.655Z",
                "updatedAt": "2026-04-06T11:29:00.495Z",
                "__v": 1
            },
        ]    
    }    

######################################################################################################
def getParcelByName_fxn(name:str):
    return {
        "status": "success",
        "data": [
            {
                "_id": "69d398da7cdc334aebd5ed7f",
                "parcelId": "P-BQ11DPIG7K",
                "category": "furniture",
                "product": "home furniture",
                "weight": 100,
                "receiverName": "gyan prakash",
                "receiverContact": "1231231231",
                "originCity": "110, Makki Masjid Main Rd, Bhangel, Goyal Colony, Salarpur Khadar, Noida, Uttar Pradesh 201304, India",
                "destinationCity": "Darbhanga, Bihar, India",
                "distanceKm": 1146.38,
                "deliveryPartner": "FedEx",
                "serviceType": "Standard",
                "cost": 18017.61,
                "currentStatus": "IN_TRANSIT",
                "expectedDeliveryDate": "2026-04-15T11:28:26.653Z",
                "deliveryDescription": "Status updated to IN_TRANSIT at noida. in packageing state",
                "isDelayed": False,
                "history": [
                    {
                        "status": "PLACED",
                        "currentLocation": "110, Makki Masjid Main Rd, Bhangel, Goyal Colony, Salarpur Khadar, Noida, Uttar Pradesh 201304, India",
                        "comment": "Parcel created via FedEx (Standard)",
                        "updatedBy": "69d36b17efb3d3c177ca762e",
                        "_id": "69d398da7cdc334aebd5ed80",
                        "updatedAt": "2026-04-06T11:28:26.654Z"
                    },
                    {
                        "status": "IN_TRANSIT",
                        "currentLocation": "noida",
                        "comment": "in packageing state",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-06T18:01:00.000Z",
                        "_id": "69d398fc7cdc334aebd5edbb"
                    }
                ],
                "createdBy": "69d36b17efb3d3c177ca762e",
                "vehicleType": "truck",
                "createdAt": "2026-04-06T11:28:26.655Z",
                "updatedAt": "2026-04-06T11:29:00.495Z",
                "__v": 1
            },
        ]
    }

######################################################################################################
def getParcelByStatus_fxn(status:str):
    return {
        "status": "success",
        "data": [
            {
                "_id": "69d398da7cdc334aebd5ed7f",
                "parcelId": "P-BQ11DPIG7K",
                "category": "furniture",
                "product": "home furniture",
                "weight": 100,
                "receiverName": "gyan prakash",
                "receiverContact": "1231231231",
                "originCity": "110, Makki Masjid Main Rd, Bhangel, Goyal Colony, Salarpur Khadar, Noida, Uttar Pradesh 201304, India",
                "destinationCity": "Darbhanga, Bihar, India",
                "distanceKm": 1146.38,
                "deliveryPartner": "FedEx",
                "serviceType": "Standard",
                "cost": 18017.61,
                "currentStatus": "IN_TRANSIT",
                "expectedDeliveryDate": "2026-04-15T11:28:26.653Z",
                "deliveryDescription": "Status updated to IN_TRANSIT at noida. in packageing state",
                "isDelayed": False,
                "history": [
                    {
                        "status": "PLACED",
                        "currentLocation": "110, Makki Masjid Main Rd, Bhangel, Goyal Colony, Salarpur Khadar, Noida, Uttar Pradesh 201304, India",
                        "comment": "Parcel created via FedEx (Standard)",
                        "updatedBy": "69d36b17efb3d3c177ca762e",
                        "_id": "69d398da7cdc334aebd5ed80",
                        "updatedAt": "2026-04-06T11:28:26.654Z"
                    },
                    {
                        "status": "IN_TRANSIT",
                        "currentLocation": "noida",
                        "comment": "in packageing state",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-06T18:01:00.000Z",
                        "_id": "69d398fc7cdc334aebd5edbb"
                    }
                ],
                "createdBy": "69d36b17efb3d3c177ca762e",
                "vehicleType": "truck",
                "createdAt": "2026-04-06T11:28:26.655Z",
                "updatedAt": "2026-04-06T11:29:00.495Z",
                "__v": 1
            },
        ]
    }

######################################################################################################
def generateInvoice_fxn(id:str):
    return {
        "status": "success",
        "message":"Your invoice has been generated successfully"
    }

######################################################################################################
def delayedParcels_fxn():
    return {
        "status": "success",
        "data": [
            {
                "_id": "69d394df7cdc334aebd5ec25",
                "parcelId": "P-MD50P6X9O3",
                "category": "clothing",
                "product": "snitch tshirts",
                "weight": 194,
                "receiverName": "deepanshu yadav",
                "receiverContact": "9992505628",
                "originCity": "798, Chinyot Colony, Rohtak, Haryana 124001, India",
                "destinationCity": "KM74, KM74, Block M, Sector 18, Kavi Nagar, Ghaziabad, Uttar Pradesh 201002, India",
                "distanceKm": 129.66,
                "deliveryPartner": "amazon logistics",
                "serviceType": "Express",
                "cost": 22332.12,
                "currentStatus": "DISPATCHED",
                "expectedDeliveryDate": "2026-04-12T11:11:27.528Z",
                "deliveryDescription": "Status updated to DISPATCHED at noida sector 42. in noida somewhere",
                "isDelayed": True,
                "history": [
                    {
                        "status": "PLACED",
                        "currentLocation": "798, Chinyot Colony, Rohtak, Haryana 124001, India",
                        "comment": "Parcel created via amazon logistics (Express)",
                        "updatedBy": "69d36b17efb3d3c177ca762e",
                        "_id": "69d394df7cdc334aebd5ec26",
                        "updatedAt": "2026-04-06T11:11:27.533Z"
                    },
                    {
                        "status": "IN_TRANSIT",
                        "currentLocation": "new delhi",
                        "comment": "in the ware house",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-07T16:42:00.000Z",
                        "_id": "69d396dc7cdc334aebd5eca7"
                    },
                    {
                        "status": "DISPATCHED",
                        "currentLocation": "noida sector 42",
                        "comment": "in noida somewhere",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-14T22:15:00.000Z",
                        "_id": "69d397b47cdc334aebd5ed18"
                    }
                ],
                "createdBy": "69d36b17efb3d3c177ca762e",
                "vehicleType": "truck",
                "createdAt": "2026-04-06T11:11:27.540Z",
                "updatedAt": "2026-04-06T11:23:32.627Z",
                "__v": 2
            }
        ]
    }

######################################################################################################
def getLatestParcel_fxn():
    return {
        "status": "success",
        "data": [
            {
                "_id": "69d394df7cdc334aebd5ec25",
                "parcelId": "P-MD50P6X9O3",
                "category": "clothing",
                "product": "snitch tshirts",
                "weight": 194,
                "receiverName": "deepanshu yadav",
                "receiverContact": "9992505628",
                "originCity": "798, Chinyot Colony, Rohtak, Haryana 124001, India",
                "destinationCity": "KM74, KM74, Block M, Sector 18, Kavi Nagar, Ghaziabad, Uttar Pradesh 201002, India",
                "distanceKm": 129.66,
                "deliveryPartner": "amazon logistics",
                "serviceType": "Express",
                "cost": 22332.12,
                "currentStatus": "DISPATCHED",
                "expectedDeliveryDate": "2026-04-12T11:11:27.528Z",
                "deliveryDescription": "Status updated to DISPATCHED at noida sector 42. in noida somewhere",
                "isDelayed": True,
                "history": [
                    {
                        "status": "PLACED",
                        "currentLocation": "798, Chinyot Colony, Rohtak, Haryana 124001, India",
                        "comment": "Parcel created via amazon logistics (Express)",
                        "updatedBy": "69d36b17efb3d3c177ca762e",
                        "_id": "69d394df7cdc334aebd5ec26",
                        "updatedAt": "2026-04-06T11:11:27.533Z"
                    },
                    {
                        "status": "IN_TRANSIT",
                        "currentLocation": "new delhi",
                        "comment": "in the ware house",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-07T16:42:00.000Z",
                        "_id": "69d396dc7cdc334aebd5eca7"
                    },
                    {
                        "status": "DISPATCHED",
                        "currentLocation": "noida sector 42",
                        "comment": "in noida somewhere",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-14T22:15:00.000Z",
                        "_id": "69d397b47cdc334aebd5ed18"
                    }
                ],
                "createdBy": "69d36b17efb3d3c177ca762e",
                "vehicleType": "truck",
                "createdAt": "2026-04-06T11:11:27.540Z",
                "updatedAt": "2026-04-06T11:23:32.627Z",
                "__v": 2
            }
        ]
    }

######################################################################################################
def getParcelByCategory_fxn(cateogry:str):
    return {
        "status": "success",
        "data": [
            {
                "_id": "69d394df7cdc334aebd5ec25",
                "parcelId": "P-MD50P6X9O3",
                "category": "clothing",
                "product": "snitch tshirts",
                "weight": 194,
                "receiverName": "deepanshu yadav",
                "receiverContact": "9992505628",
                "originCity": "798, Chinyot Colony, Rohtak, Haryana 124001, India",
                "destinationCity": "KM74, KM74, Block M, Sector 18, Kavi Nagar, Ghaziabad, Uttar Pradesh 201002, India",
                "distanceKm": 129.66,
                "deliveryPartner": "amazon logistics",
                "serviceType": "Express",
                "cost": 22332.12,
                "currentStatus": "DISPATCHED",
                "expectedDeliveryDate": "2026-04-12T11:11:27.528Z",
                "deliveryDescription": "Status updated to DISPATCHED at noida sector 42. in noida somewhere",
                "isDelayed": True,
                "history": [
                    {
                        "status": "PLACED",
                        "currentLocation": "798, Chinyot Colony, Rohtak, Haryana 124001, India",
                        "comment": "Parcel created via amazon logistics (Express)",
                        "updatedBy": "69d36b17efb3d3c177ca762e",
                        "_id": "69d394df7cdc334aebd5ec26",
                        "updatedAt": "2026-04-06T11:11:27.533Z"
                    },
                    {
                        "status": "IN_TRANSIT",
                        "currentLocation": "new delhi",
                        "comment": "in the ware house",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-07T16:42:00.000Z",
                        "_id": "69d396dc7cdc334aebd5eca7"
                    },
                    {
                        "status": "DISPATCHED",
                        "currentLocation": "noida sector 42",
                        "comment": "in noida somewhere",
                        "updatedBy": "68f8ac5f7a9c7a3a8fb2f14b",
                        "updatedAt": "2026-04-14T22:15:00.000Z",
                        "_id": "69d397b47cdc334aebd5ed18"
                    }
                ],
                "createdBy": "69d36b17efb3d3c177ca762e",
                "vehicleType": "truck",
                "createdAt": "2026-04-06T11:11:27.540Z",
                "updatedAt": "2026-04-06T11:23:32.627Z",
                "__v": 2
            }
        ]
    }
